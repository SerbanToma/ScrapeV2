"""
JWT Authentication utilities and helper functions
"""
import jwt
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jwt.exceptions import DecodeError, InvalidTokenError

from shared.config import settings
from shared.database import get_db
from shared.db_models.user import User, TokenBlocklist

# Constants
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

# Exception for authentication errors
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

# Bearer token scheme
bearer_scheme = HTTPBearer()


def create_access_token(username: str, user_id: int) -> str:
    """Create a JWT access token for a user"""
    now = datetime.utcnow()
    to_encode = {
        "sub": username,
        "user_id": user_id,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": str(uuid.uuid4()),
        "iat": now,
        "type": "access"
    }
    access_token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return access_token


def create_refresh_token(username: str, user_id: int) -> str:
    """Create a JWT refresh token for a user"""
    now = datetime.utcnow()
    to_encode = {
        "sub": username,
        "user_id": user_id,
        "exp": now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "jti": str(uuid.uuid4()),
        "iat": now,
        "type": "refresh"
    }
    refresh_token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return refresh_token


def verify_token(token: str, db: Session) -> Dict:
    """
    Verify and decode a JWT token
    
    Args:
        token: JWT token string
        db: Database session
        
    Returns:
        Dict: Decoded token payload
        
    Raises:
        HTTPException: If token is invalid, expired, or blacklisted
    """
    try:
        # Decode the token
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti:
            db_blocklist = db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first()
            if db_blocklist:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Token has been revoked. Please log in again"
                )
        
        # Check token type
        token_type = payload.get("type")
        if not token_type:
            raise CREDENTIALS_EXCEPTION
            
        return payload
        
    except DecodeError:
        raise CREDENTIALS_EXCEPTION
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again"
        )
    except InvalidTokenError:
        raise CREDENTIALS_EXCEPTION


def blacklist_token(token: str, db: Session, reason: str = "logout") -> bool:
    """
    Add a token to the blacklist
    
    Args:
        token: JWT token to blacklist
        db: Database session
        reason: Reason for blacklisting
        
    Returns:
        bool: True if successful
    """
    try:
        # Decode token to get information
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_exp": False}  # Don't verify expiration for blacklisting
        )
        
        jti = payload.get("jti")
        user_id = payload.get("user_id")
        token_type = payload.get("type", "access")
        exp = payload.get("exp")
        
        if not jti or not user_id:
            return False
            
        # Convert exp timestamp to datetime
        expires_at = datetime.utcfromtimestamp(exp) if exp else datetime.utcnow()
        
        # Check if already blacklisted
        existing = db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first()
        if existing:
            return True  # Already blacklisted
            
        # Add to blacklist
        blocklist_entry = TokenBlocklist(
            jti=jti,
            token_type=token_type,
            user_id=user_id,
            expires_at=expires_at,
            reason=reason
        )
        
        db.add(blocklist_entry)
        db.commit()
        return True
        
    except Exception:
        db.rollback()
        return False


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token
    
    Args:
        credentials: Bearer token credentials
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    
    try:
        # Verify token
        payload = verify_token(token, db)
        
        # Extract user information
        username = payload.get("sub")
        user_id = payload.get("user_id")
        token_type = payload.get("type")
        
        if not username or not user_id:
            raise CREDENTIALS_EXCEPTION
            
        # Ensure it's an access token
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Access token required."
            )
        
        # Get user from database
        user = db.query(User).filter(User.id == user_id, User.username == username).first()
        if user is None:
            raise CREDENTIALS_EXCEPTION
            
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated"
            )
            
        return user
        
    except HTTPException:
        raise
    except Exception:
        raise CREDENTIALS_EXCEPTION


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and ensure they are active
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        User: Active user
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_user_jti(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> str:
    """
    Extract JWT ID (jti) from token for blacklisting purposes
    
    Args:
        credentials: Bearer token credentials
        
    Returns:
        str: JWT ID (jti)
        
    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_exp": False}  # Don't verify expiration for jti extraction
        )
        jti = payload.get("jti")
        if jti is None:
            raise CREDENTIALS_EXCEPTION
        return jti
        
    except InvalidTokenError:
        raise CREDENTIALS_EXCEPTION


def refresh_access_token(refresh_token: str, db: Session) -> Optional[str]:
    """
    Generate a new access token from a valid refresh token
    
    Args:
        refresh_token: JWT refresh token
        db: Database session
        
    Returns:
        str: New access token, or None if refresh token is invalid
    """
    try:
        # Verify refresh token
        payload = verify_token(refresh_token, db)
        
        # Ensure it's a refresh token
        token_type = payload.get("type")
        if token_type != "refresh":
            return None
            
        # Get user information
        username = payload.get("sub")
        user_id = payload.get("user_id")
        
        if not username or not user_id:
            return None
            
        # Verify user exists and is active
        user = db.query(User).filter(
            User.id == user_id, 
            User.username == username,
            User.is_active == True
        ).first()
        
        if not user:
            return None
            
        # Create new access token
        new_access_token = create_access_token(username, user_id)
        return new_access_token
        
    except Exception:
        return None


# Helper function to create both tokens
def create_tokens_for_user(user: User) -> Dict[str, str]:
    """
    Create both access and refresh tokens for a user
    
    Args:
        user: User object
        
    Returns:
        Dict containing access_token and refresh_token
    """
    access_token = create_access_token(user.username, user.id)
    refresh_token = create_refresh_token(user.username, user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
