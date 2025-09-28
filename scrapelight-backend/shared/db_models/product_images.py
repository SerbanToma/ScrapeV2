from sqlalchemy import Index, Column, Integer, Text, ForeignKey, String, func, DateTime
from sqlalchemy.orm import relationship

from shared.database import Base


class ProductImages(Base):
    __tablename__ = 'product_images'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    image_url = Column(Text, nullable=False)
    image_index = Column(Integer, default=0)
    local_path = Column(String(500))  # For storing downloaded image path
    is_downloaded = Column(String(10), default='false')  # 'true'/'false' as string

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to product
    product = relationship("Product", back_populates="images")

    # Composite index for faster queries
    __table_args__ = (
        Index('idx_product_image_index', 'product_id', 'image_index'),
    )

    def __repr__(self):
        return f"<ProductImages(product_id={self.product_id}, image_index={self.image_index})>"

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'image_url': self.image_url,
            'image_index': self.image_index,
            'local_path': self.local_path,
            'is_downloaded': self.is_downloaded,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }