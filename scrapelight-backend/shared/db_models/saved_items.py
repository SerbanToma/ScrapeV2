"""
Saved Items model for user favorites
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.database import Base

class SavedItem(Base):
    """Model for storing user saved/favorite items"""
    __tablename__ = 'saved_items'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    product_id = Column(String(100), nullable=False)  # Reference to product
    product_title = Column(String(255), nullable=False)
    product_url = Column(String(500))
    product_image_url = Column(String(500))
    product_data = Column(JSON)  # Store full product info for quick access
    notes = Column(Text)  # User's personal notes about this item
    tags = Column(JSON)  # User-defined tags for organization
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="saved_items")
    
    # Prevent duplicate saves
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='unique_user_product'),
        Index('idx_user_saved_date', 'user_id', 'created_at'),
        # Note: JSON indexes require GIN operator class, which we'll handle in migrations if needed
    )
    
    def __repr__(self):
        return f"<SavedItem(id={self.id}, user_id={self.user_id}, product_id='{self.product_id}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'product_title': self.product_title,
            'product_url': self.product_url,
            'product_image_url': self.product_image_url,
            'product_data': self.product_data,
            'notes': self.notes,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
