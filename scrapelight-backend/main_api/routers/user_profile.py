"""
User Profile router for search history, saved items, and profile management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional

from shared.database import get_db
from shared.db_models.user import User
from shared.db_models.search_history import SearchHistory
from shared.db_models.saved_items import SavedItem
from shared.schemas import (
    SearchHistoryCreate, SearchHistoryResponse,
    SavedItemCreate, SavedItemUpdate, SavedItemResponse,
    UserProfileResponse, Message
)
from shared.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])


# ============== Profile Info ==============

@router.get("/me", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile with stats"""
    # Get counts
    search_count = db.query(func.count(SearchHistory.id)).filter(
        SearchHistory.user_id == current_user.id
    ).scalar() or 0
    
    saved_items_count = db.query(func.count(SavedItem.id)).filter(
        SavedItem.user_id == current_user.id
    ).scalar() or 0
    
    # Convert user to dict and add stats
    user_dict = current_user.to_dict()
    user_dict.update({
        'search_count': search_count,
        'saved_items_count': saved_items_count
    })
    
    return user_dict


# ============== Search History ==============

@router.post("/search-history", response_model=SearchHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_search_history(
    search_data: SearchHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new search history entry"""
    db_search = SearchHistory(
        user_id=current_user.id,
        search_type=search_data.search_type,
        query_data=search_data.query_data,
        results_count=search_data.results_count,
        results_summary=search_data.results_summary
    )
    
    db.add(db_search)
    try:
        db.commit()
        db.refresh(db_search)
        return db_search
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving search history"
        )


@router.get("/search-history", response_model=List[SearchHistoryResponse])
async def get_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search_type: Optional[str] = Query(None, regex="^(picture|spec)$")
):
    """Get user's search history"""
    query = db.query(SearchHistory).filter(SearchHistory.user_id == current_user.id)
    
    if search_type:
        query = query.filter(SearchHistory.search_type == search_type)
    
    searches = query.order_by(desc(SearchHistory.created_at)).offset(offset).limit(limit).all()
    return searches


@router.delete("/search-history/{search_id}", response_model=Message)
async def delete_search_history(
    search_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a search history entry"""
    search = db.query(SearchHistory).filter(
        SearchHistory.id == search_id,
        SearchHistory.user_id == current_user.id
    ).first()
    
    if not search:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search history entry not found"
        )
    
    db.delete(search)
    try:
        db.commit()
        return {"message": "Search history entry deleted successfully"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting search history entry"
        )


@router.delete("/search-history", response_model=Message)
async def clear_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all search history for current user"""
    try:
        deleted_count = db.query(SearchHistory).filter(
            SearchHistory.user_id == current_user.id
        ).delete()
        db.commit()
        return {"message": f"Cleared {deleted_count} search history entries"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error clearing search history"
        )


# ============== Saved Items ==============

@router.post("/saved-items", response_model=SavedItemResponse, status_code=status.HTTP_201_CREATED)
async def save_item(
    item_data: SavedItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a product item to user's favorites"""
    # Check if already saved
    existing = db.query(SavedItem).filter(
        SavedItem.user_id == current_user.id,
        SavedItem.product_id == item_data.product_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Item already saved"
        )
    
    db_item = SavedItem(
        user_id=current_user.id,
        product_id=item_data.product_id,
        product_title=item_data.product_title,
        product_url=item_data.product_url,
        product_image_url=item_data.product_image_url,
        product_data=item_data.product_data,
        notes=item_data.notes,
        tags=item_data.tags
    )
    
    db.add(db_item)
    try:
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving item"
        )


@router.get("/saved-items", response_model=List[SavedItemResponse])
async def get_saved_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tag: Optional[str] = Query(None)
):
    """Get user's saved items"""
    query = db.query(SavedItem).filter(SavedItem.user_id == current_user.id)
    
    if tag:
        # Filter by tag (JSON contains)
        query = query.filter(SavedItem.tags.contains([tag]))
    
    items = query.order_by(desc(SavedItem.created_at)).offset(offset).limit(limit).all()
    return items


@router.put("/saved-items/{item_id}", response_model=SavedItemResponse)
async def update_saved_item(
    item_id: int,
    update_data: SavedItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notes and tags for a saved item"""
    item = db.query(SavedItem).filter(
        SavedItem.id == item_id,
        SavedItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved item not found"
        )
    
    if update_data.notes is not None:
        item.notes = update_data.notes
    if update_data.tags is not None:
        item.tags = update_data.tags
    
    try:
        db.commit()
        db.refresh(item)
        return item
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating saved item"
        )


@router.delete("/saved-items/{item_id}", response_model=Message)
async def delete_saved_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove an item from saved items"""
    item = db.query(SavedItem).filter(
        SavedItem.id == item_id,
        SavedItem.user_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved item not found"
        )
    
    db.delete(item)
    try:
        db.commit()
        return {"message": "Item removed from saved items"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error removing saved item"
        )


@router.get("/saved-items/tags", response_model=List[str])
async def get_saved_item_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all unique tags used by the user"""
    # This is a bit complex with JSON fields, simplified approach
    items = db.query(SavedItem.tags).filter(
        SavedItem.user_id == current_user.id,
        SavedItem.tags.isnot(None)
    ).all()
    
    all_tags = set()
    for (tags,) in items:
        if tags and isinstance(tags, list):
            all_tags.update(tags)
    
    return sorted(list(all_tags))
