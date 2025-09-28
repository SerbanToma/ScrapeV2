from sqlalchemy import Integer, Column, ForeignKey, String, LargeBinary, Index
from shared.database import Base


class ImageFeatures(Base):
    __tablename__ = 'image_features'

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False, unique=False)
    image_path = Column(String(500), nullable=False, unique=False)
    features = Column(LargeBinary, nullable=False)

    # Create composite unique constraint (product can have multiple images)
    __table_args__ = (
        Index('idx_product_image', 'product_id', 'image_path', unique=True),
        Index('idx_product_id', 'product_id'),
    )