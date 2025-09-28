"""
User model for authentication system
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.database import Base
import hashlib
import secrets

class User(Base):
    """User model for authentication"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(64), nullable=False)  # SHA256 hash
    salt = Column(String(32), nullable=False)  # Salt for password hashing
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    search_history = relationship("SearchHistory", back_populates="user", cascade="all, delete-orphan")
    saved_items = relationship("SavedItem", back_populates="user", cascade="all, delete-orphan")
    
    # Additional indexes for performance
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_username_active', 'username', 'is_active'),
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
    
    def set_password(self, password: str):
        """Hash and set password with salt"""
        self.salt = secrets.token_hex(16)  # 32 character hex string
        # Combine password and salt, then hash with SHA256
        password_salt_combo = f"{password}{self.salt}"
        self.password_hash = hashlib.sha256(password_salt_combo.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash"""
        if not self.salt or not self.password_hash:
            return False
        
        password_salt_combo = f"{password}{self.salt}"
        computed_hash = hashlib.sha256(password_salt_combo.encode()).hexdigest()
        return computed_hash == self.password_hash
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for API responses"""
        result = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }
        
        # Only include sensitive data if explicitly requested (for admin purposes)
        if include_sensitive:
            result.update({
                'password_hash': self.password_hash,
                'salt': self.salt,
            })
        
        return result


class TokenBlocklist(Base):
    """Model to track blacklisted/revoked JWT tokens"""
    __tablename__ = 'token_blocklist'
    
    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(36), unique=True, index=True, nullable=False)  # JWT ID
    token_type = Column(String(20), nullable=False)  # 'access' or 'refresh'
    user_id = Column(Integer, nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(100))  # logout, security, expired, etc.
    
    __table_args__ = (
        Index('idx_jti_expires', 'jti', 'expires_at'),
        Index('idx_user_token_type', 'user_id', 'token_type'),
    )
    
    def __repr__(self):
        return f"<TokenBlocklist(jti='{self.jti}', user_id={self.user_id}, type='{self.token_type}')>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'jti': self.jti,
            'token_type': self.token_type,
            'user_id': self.user_id,
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'reason': self.reason,
        }
