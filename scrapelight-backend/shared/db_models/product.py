from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.orm import relationship
from shared.database import Base

class Product(Base):
    __tablename__ = 'product'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String(100), unique=True, index=True, nullable=False)
    product_title = Column(String(255), nullable=False)
    article = Column(String(255), nullable=False, index=True)
    material = Column(String(255))
    bulb_type = Column(String(100))
    category = Column(String(100))
    dimensions = Column(String(255))
    url = Column(String())
    store = Column(String(255))

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