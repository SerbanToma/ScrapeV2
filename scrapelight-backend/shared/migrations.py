"""
Database migration system for automatic table creation and migration tracking.
"""
import logging
from sqlalchemy import Column, Integer, String, DateTime, Text, MetaData, Table
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql import func
from shared.database import Base, engine, SessionLocal
from shared.config import settings
from datetime import datetime
import importlib
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class MigrationHistory(Base):
    """Track applied migrations"""
    __tablename__ = 'migration_history'
    
    id = Column(Integer, primary_key=True, index=True)
    migration_name = Column(String(255), unique=True, nullable=False)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default='success')  # success, failed, rollback
    description = Column(Text)

class MigrationManager:
    """Manages database migrations and table creation"""
    
    def __init__(self):
        self.session = None
        
    def _get_session(self):
        """Get database session"""
        if not self.session:
            self.session = SessionLocal()
        return self.session
    
    def _close_session(self):
        """Close database session"""
        if self.session:
            self.session.close()
            self.session = None
    
    def create_migration_table(self):
        """Create the migration history table if it doesn't exist"""
        try:
            # Create only the migration history table first
            MigrationHistory.__table__.create(engine, checkfirst=True)
            logger.info("Migration history table created/verified")
        except SQLAlchemyError as e:
            logger.error(f"Error creating migration history table: {e}")
            raise
    
    def get_applied_migrations(self):
        """Get list of applied migrations"""
        session = self._get_session()
        try:
            applied = session.query(MigrationHistory.migration_name).all()
            return [migration[0] for migration in applied]
        except SQLAlchemyError as e:
            logger.error(f"Error getting applied migrations: {e}")
            return []
        finally:
            self._close_session()
    
    def record_migration(self, migration_name: str, status: str = 'success', description: str = None):
        """Record a migration in the history"""
        session = self._get_session()
        try:
            migration_record = MigrationHistory(
                migration_name=migration_name,
                status=status,
                description=description or f"Applied migration: {migration_name}"
            )
            session.add(migration_record)
            session.commit()
            logger.info(f"Recorded migration: {migration_name}")
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error recording migration {migration_name}: {e}")
            raise
        finally:
            self._close_session()
    
    def get_all_models(self):
        """Dynamically import and return all model classes"""
        models = []
        db_models_path = settings.db_models_dir
        
        # Import all model files
        for file_path in db_models_path.glob('*.py'):
            if file_path.name.startswith('__'):
                continue
                
            module_name = f"shared.db_models.{file_path.stem}"
            try:
                module = importlib.import_module(module_name)
                # Get all classes that inherit from Base
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (isinstance(attr, type) and 
                        hasattr(attr, '__tablename__') and 
                        issubclass(attr, Base) and 
                        attr != Base):
                        models.append(attr)
                        logger.debug(f"Found model: {attr.__name__}")
            except ImportError as e:
                logger.warning(f"Could not import {module_name}: {e}")
        
        return models
    
    def get_existing_tables(self):
        """Get list of existing tables in the database"""
        try:
            metadata = MetaData()
            metadata.reflect(bind=engine)
            return list(metadata.tables.keys())
        except SQLAlchemyError as e:
            logger.error(f"Error getting existing tables: {e}")
            return []
    
    def create_missing_tables(self):
        """Create tables for models that don't exist in the database"""
        try:
            existing_tables = self.get_existing_tables()
            models = self.get_all_models()
            
            created_tables = []
            
            for model in models:
                table_name = model.__tablename__
                if table_name not in existing_tables:
                    try:
                        model.__table__.create(engine, checkfirst=True)
                        created_tables.append(table_name)
                        logger.info(f"Created table: {table_name}")
                        
                        # Record this as a migration
                        self.record_migration(
                            f"create_table_{table_name}",
                            'success',
                            f"Auto-created table {table_name} for model {model.__name__}"
                        )
                    except SQLAlchemyError as e:
                        logger.error(f"Error creating table {table_name}: {e}")
                        self.record_migration(
                            f"create_table_{table_name}",
                            'failed',
                            f"Failed to create table {table_name}: {str(e)}"
                        )
                else:
                    logger.debug(f"Table {table_name} already exists")
            
            if created_tables:
                logger.info(f"Created {len(created_tables)} new tables: {', '.join(created_tables)}")
            else:
                logger.info("All tables are up to date")
                
            return created_tables
            
        except Exception as e:
            logger.error(f"Error in create_missing_tables: {e}")
            raise
    
    def run_startup_migrations(self):
        """Run all startup migrations - creates missing tables"""
        try:
            logger.info("Starting database migration check...")
            
            # First ensure migration history table exists
            self.create_migration_table()
            
            # Create any missing tables
            created_tables = self.create_missing_tables()
            
            # Record startup migration
            migration_name = f"startup_migration_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            description = f"Startup migration completed. Created tables: {', '.join(created_tables) if created_tables else 'none'}"
            
            self.record_migration(migration_name, 'success', description)
            
            logger.info("Database migration check completed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Startup migration failed: {e}")
            return False

# Global migration manager instance
migration_manager = MigrationManager()

def run_migrations():
    """Convenience function to run migrations"""
    return migration_manager.run_startup_migrations()
