"""
Search History model for tracking user searches
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.database import Base

class SearchHistory(Base):
    """Model for storing user search history"""
    __tablename__ = 'search_history'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    search_type = Column(String(20), nullable=False)  # 'picture' or 'spec'
    query_data = Column(JSON, nullable=False)  # Store search parameters
    results_count = Column(Integer, default=0)
    results_summary = Column(JSON)  # Store top results for quick display
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="search_history")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_user_search_date', 'user_id', 'created_at'),
        Index('idx_search_type_date', 'search_type', 'created_at'),
    )
    
    def __repr__(self):
        return f"<SearchHistory(id={self.id}, user_id={self.user_id}, type='{self.search_type}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'search_type': self.search_type,
            'query_data': self.query_data,
            'results_count': self.results_count,
            'results_summary': self.results_summary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

