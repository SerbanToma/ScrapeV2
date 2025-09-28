"""
Authentication router for user registration, login, logout, and token management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
import re
from celery import Celery

from shared.database import get_db
from shared.db_models.user import User, TokenBlocklist
from shared.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse, 
    TokenRefresh, Message, PasswordChange, UserUpdate
)
from shared.auth import (
    create_tokens_for_user, verify_token, blacklist_token,
    refresh_access_token, get_current_user, get_user_jti,
    bearer_scheme, CREDENTIALS_EXCEPTION
)
from shared.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

celery_app = Celery('scrapelight', broker='redis://redis:6379/0', backend='redis://redis:6379/0')


def validate_password_strength(password: str) -> bool:
    """Validate password strength requirements"""
    if len(password) < 6:
        return False
    # Add more password requirements as needed
    # e.g., require uppercase, lowercase, numbers, special chars
    return True


def validate_username(username: str) -> bool:
    """Validate username format"""
    # Username should be 3-50 chars, alphanumeric + underscore, no spaces
    pattern = r'^[a-zA-Z0-9_]{3,50}$'
    return bool(re.match(pattern, username))


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account
    
    - **username**: Unique username (3-50 characters, alphanumeric + underscore)
    - **email**: Valid email address
    - **password**: Password (minimum 6 characters)
    """
    # Validate username format
    if not validate_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-50 characters long and contain only letters, numbers, and underscores"
        )
    
    # Validate password strength
    if not validate_password_strength(user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already in use. Please select a new username"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = User(
        username=user_data.username,
        email=user_data.email
    )
    db_user.set_password(user_data.password)
    
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        task = celery_app.send_task(
            'ml_worker.tasks.email_tasks.send_registration_email',
            args=[db_user.username, db_user.email],
        )
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user account"
        )


@router.post("/login", response_model=TokenResponse)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return access and refresh tokens
    
    - **username**: Username or email address
    - **password**: User password
    """
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == user_credentials.username) | 
        (User.email == user_credentials.username)
    ).first()
    
    # Check if user exists and password is correct
    if not user or not user.verify_password(user_credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    tokens = create_tokens_for_user(user)
    tokens["expires_in"] = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """
    Refresh access token using a valid refresh token
    
    - **refresh_token**: Valid refresh token
    """
    new_access_token = refresh_access_token(token_data.refresh_token, db)
    
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    return {
        "access_token": new_access_token,
        "refresh_token": token_data.refresh_token,  # Keep the same refresh token
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/logout", response_model=Message)
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    """
    Logout user by blacklisting their current token
    
    Requires: Valid access token in Authorization header
    """
    token = credentials.credentials
    
    # Blacklist the token
    success = blacklist_token(token, db, reason="logout")
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to logout. Token may already be invalid."
        )
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user's profile information
    
    Requires: Valid access token in Authorization header
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile information
    
    - **email**: New email address (optional)
    - **username**: New username (optional)
    
    Requires: Valid access token in Authorization header
    """
    # Check if new username is provided and validate it
    if user_update.username and user_update.username != current_user.username:
        if not validate_username(user_update.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be 3-50 characters long and contain only letters, numbers, and underscores"
            )
        
        # Check if username already exists
        if db.query(User).filter(
            User.username == user_update.username, 
            User.id != current_user.id
        ).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        current_user.username = user_update.username
    
    # Check if new email is provided
    if user_update.email and user_update.email != current_user.email:
        # Check if email already exists
        if db.query(User).filter(
            User.email == user_update.email, 
            User.id != current_user.id
        ).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        current_user.email = user_update.email
        current_user.is_verified = False  # Re-verification needed
    
    try:
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating profile"
        )


@router.post("/change-password", response_model=Message)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user's password
    
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 6 characters)
    
    Requires: Valid access token in Authorization header
    """
    # Verify current password
    if not current_user.verify_password(password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password strength
    if not validate_password_strength(password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Check if new password is different from current
    if current_user.verify_password(password_data.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Set new password
    current_user.set_password(password_data.new_password)
    
    try:
        db.commit()
        return {"message": "Password changed successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password"
        )


@router.post("/revoke-token", response_model=Message)
async def revoke_token(
    token_data: TokenRefresh,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke a specific refresh token
    
    - **refresh_token**: Refresh token to revoke
    
    Requires: Valid access token in Authorization header
    """
    success = blacklist_token(token_data.refresh_token, db, reason="revoked")
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to revoke token. Token may already be invalid."
        )
    
    return {"message": "Token revoked successfully"}


@router.get("/validate", response_model=Message)
async def validate_token(current_user: User = Depends(get_current_user)):
    """
    Validate current token and return user info
    
    Requires: Valid access token in Authorization header
    """
    return {
        "message": "Token is valid",
        "detail": f"Authenticated as {current_user.username}"
    }
