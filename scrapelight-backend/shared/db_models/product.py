from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.orm import relationship
from shared.database import Base

class Product(Base):
    __tablename__ = 'product'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Text, unique=True, index=True, nullable=False)  # Changed from String(100) to Text
    product_title = Column(Text, nullable=False)  # Changed from String(255) to Text
    article = Column(Text, nullable=False, index=True)  # Changed from String(255) to Text
    material = Column(Text)  # Changed from String(255) to Text
    bulb_type = Column(Text)  # Changed from String(100) to Text
    category = Column(Text)  # Changed from String(100) to Text
    dimensions = Column(Text)  # Changed from String(255) to Text
    url = Column(Text)  # Changed from String() to Text for consistency
    store = Column(Text)  # Changed from String(255) to Text

    images = relationship("ProductImages", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_article_product_id', 'article', 'product_id'),
    )

    def __repr__(self):
        return f"<Product(product_id='{self.product_id}', title='{self.product_title}', article='{self.article}')>"

    def to_dict(self, include_images=False):
        result = {
            'id': self.id,
            'product_id': self.product_id,
            'product_title': self.product_title,
            'article': self.article,
            'material': self.material,
            'bulb_type': self.bulb_type,
            'category': self.category,
            'dimensions': self.dimensions,
        }
        if include_images:
            result['images'] = [img.to_dict() for img in self.images]

        return result