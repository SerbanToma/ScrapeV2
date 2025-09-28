import re

import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from shared import StoresModel
from shared.db_models import Product, ImageFeatures, ProductImages
from shared.database import Base
from shared.config import settings
from shared.logger import setup_logger
from typing import Dict, Any, Optional

logger = setup_logger(__name__)


def make_relative(path, base_folder):
    abs_base = os.path.abspath(base_folder)
    abs_path = os.path.abspath(path)
    if abs_path.startswith(abs_base):
        return os.path.relpath(abs_path, abs_base)
    return path


class DatabaseManager:
    def __init__(self, database_url: str = None):
        db_url_to_use = database_url or settings.DATABASE_URL

        # Configure SSL for Google Cloud SQL if needed
        connect_args = {}
        if "sqlite" not in db_url_to_use:
            # For PostgreSQL (including Google Cloud SQL)
            connect_args = {
                "sslmode": "require" if "cloudsql" in db_url_to_use or "googleapis" in db_url_to_use else "prefer"
            }

        self.engine = create_engine(
            db_url_to_use,
            echo=False,
            connect_args=connect_args
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

    def get_session(self):
        return self.SessionLocal()

    # ======================================= PRODUCT DATABASE SCRIPTS =====================================================

    def get_product_by_product_id_and_article(self, product_id: str, article: str, store: str = StoresModel.All.value) -> Optional[Product]:
        session = self.get_session()
        try:
            query = session.query(Product)

            if store != StoresModel.All.value:
                query = query.filter(Product.store == store)

            product = query.filter(
                Product.product_id == product_id,
                Product.article == article
            ).first()
            # logger.info(f"Found product {product_id} with article {article}")
            return product
        finally:
            session.close()

    def get_product_by_specifications(
            self,
            product_details: Optional[str],
            bulb_type: Optional[str],
            dimensions: Optional[str],
            category: Optional[str],
            store: str = StoresModel.All.value
    ):
        session = self.get_session()
        try:
            query = session.query(Product)
            if store != StoresModel.All.value:
                query = query.filter(Product.store == store)

            if bulb_type:
                query = query.filter(Product.bulb_type.ilike(f"%{bulb_type}%"))
            if dimensions:
                # Split by comma, strip whitespace, and search for each part
                parts = re.findall(r"[A-Za-z]: ?[0-9]+", dimensions)
                # for part in dimensions.split(','):
                for part in parts:
                    part = part.strip()
                    if part:
                        query = query.filter(Product.dimensions.ilike(f"%{part}%"))
            if category:
                query = query.filter(Product.url.ilike(f"%{category}%"))

            if product_details:
                for part in product_details.split(' '):
                    part = part.strip()
                    if part:
                        query = query.filter(Product.material.ilike(f"%{part}%"))

            products = query.all()
            results = []
            for product in products:
                # Find a representative image if available
                image_path = None
                if hasattr(product, 'images') and product.images:
                    image_path = product.images[0].local_path if hasattr(product.images[0], 'local_path') else None
                image_url = self.get_public_url_by_path(image_path)
                results.append({
                    'product_label': f"{product.article}_{product.product_id}",
                    'similarity': 1.0,  # Not relevant for spec search
                    'matching_image_path': image_path,
                    'product_id': product.id,
                    'url': product.url,
                    'article': product.article,
                    'product_title': product.product_title,
                    'bulb_type': product.bulb_type,
                    'dimensions': product.dimensions,
                    'image_url': image_url,
                })
            return results
        finally:
            session.close()

    # ======================================= IMAGE FEATURES DATABASE SCRIPTS ==============================================

    def store_features(self, product_id: int, image_path: str, features: np.ndarray):
        """Store features for a single image"""
        db = self.get_session()
        try:
            # Convert numpy array to bytes
            features_bytes = features.astype(np.float32).tobytes()

            # Create or update feature record
            feature_record = ImageFeatures(
                product_id=product_id,
                image_path=image_path,
                features=features_bytes
            )

            # Use merge to handle duplicates (update if exists, insert if not)
            db.merge(feature_record)
            db.commit()

        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def check_database_connection(self):
        """Check if database connection is working"""
        try:
            db = self.get_session()
            # Try a simple query using SQLAlchemy 2.0+ syntax
            from sqlalchemy import text
            result = db.execute(text("SELECT 1")).fetchone()
            logger.info("Database connection successful")
            return True
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            return False
        finally:
            db.close()

    def get_feature_count(self):
        """Get the number of features in the database"""
        try:
            db = self.get_session()
            count = db.query(ImageFeatures).count()
            logger.info(f"Found {count} feature records in database")
            return count
        except Exception as e:
            logger.error(f"Error getting feature count: {str(e)}")
            return 0
        finally:
            db.close()

    def get_all_features(self) -> Dict[str, Any]:
        db = self.get_session()
        try:
            # Query all features
            results = db.query(ImageFeatures).all()
            # logger.info(f"Found {len(results)} feature records in database")

            if len(results) == 0:
                logger.warning("No feature records found in database")
                return {
                    'features': np.array([]),
                    'labels': [],
                    'paths': []
                }

            all_features = []
            all_labels = []
            all_paths = []

            for i, record in enumerate(results):
                try:
                    logger.debug(f"Processing record {i+1}/{len(results)}: ID={record.id}, product_id={record.product_id}")
                    
                    # Convert bytes back to numpy array
                    if isinstance(record.features, bytes):
                        features = np.frombuffer(record.features, dtype=np.float32)
                    else:
                        # Handle case where features might be stored differently
                        features = np.array(record.features, dtype=np.float32)
                    
                    # Reshape to original dimensions (adjust based on your model)
                    features = features.reshape(-1)  # Will be 512 for our model

                    all_features.append(features)
                    all_labels.append(record.product_id)


                    
                    # Handle image_path encoding
                    if isinstance(record.image_path, bytes):
                        all_paths.append(record.image_path.decode('utf-8'))
                    else:
                        all_paths.append(str(record.image_path))
                        
                except Exception as e:
                    logger.error(f"Error processing features for record {record.id}: {str(e)}")
                    logger.error(f"Record features type: {type(record.features)}")
                    logger.error(f"Record image_path type: {type(record.image_path)}")
                    continue

            # logger.info(f"Successfully processed {len(all_features)} features")
            # logger.info(f"Feature array shape: {np.array(all_features).shape if all_features else 'empty'}")
            # logger.info(f"Labels count: {len(all_labels)}")
            # logger.info(f"Paths count: {len(all_paths)}")
            
            return {
                'features': np.array(all_features) if all_features else np.array([]),
                'labels': all_labels,
                'paths': all_paths
            }

        except Exception as e:
            logger.error(f"Error in get_all_features: {str(e)}")
            return {
                'features': np.array([]),
                'labels': [],
                'paths': []
            }
        finally:
            db.close()

    def test_database_setup(self):
        """Test database setup and check if tables exist"""
        try:
            db = self.get_session()
            
            # Check if tables exist
            from sqlalchemy import inspect
            inspector = inspect(self.engine)
            tables = inspector.get_table_names()
            logger.info(f"Available tables: {tables}")
            
            # Check if image_features table exists
            if 'image_features' not in tables:
                logger.error("image_features table does not exist")
                return False
            
            # Check if table has data
            count = db.query(ImageFeatures).count()
            logger.info(f"image_features table has {count} records")
            
            if count == 0:
                logger.warning("image_features table is empty")
                return False
            
            # Check a sample record
            sample = db.query(ImageFeatures).first()
            if sample:
                logger.info(f"Sample record - ID: {sample.id}, product_id: {sample.product_id}")
                
                # Handle image_path encoding safely
                try:
                    if isinstance(sample.image_path, bytes):
                        image_path_str = sample.image_path.decode('utf-8')
                    else:
                        image_path_str = str(sample.image_path)
                    logger.info(f"Sample image_path: {image_path_str[:50]}...")
                except Exception as e:
                    logger.warning(f"Could not decode image_path: {str(e)}")
                
                # Handle features info safely
                try:
                    if isinstance(sample.features, bytes):
                        features_size = len(sample.features)
                    else:
                        features_size = len(sample.features) if hasattr(sample.features, '__len__') else 'unknown'
                    logger.info(f"Features type: {type(sample.features)}, size: {features_size}")
                except Exception as e:
                    logger.warning(f"Could not get features info: {str(e)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error testing database setup: {str(e)}")
            return False
        finally:
            db.close()

# ======================================= PRODUCT IMAGES DATABASE SCRIPTS ==============================================

    def get_public_url_by_path(self, img_path):
        session = self.get_session()
        try:
            product_image = session.query(ProductImages).filter(ProductImages.local_path == img_path).first()
            return product_image.image_url
        except Exception as e:
            logger.error(f"Error retrieving public url: {str(e)}")
        finally:
            session.close()
