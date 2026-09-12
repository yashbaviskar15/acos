"""
Aravanta CloudOS — Community API Router
REST API endpoints for community discussions, comments, likes, search, and moderation.
"""
import uuid
import json
import html
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from app.core.database import get_db
from app.services.arvgate.models import User
from app.services.arvgate.dependencies import get_current_user, get_current_user_optional
from app.core.cloud_models import emit_notification
from .models import CommunityPost, CommunityComment, CommunityLike

router = APIRouter(prefix="/api/v1/community", tags=["ArvCommunity — Platform Discussions"])


# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class PostCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=5, max_length=30000)
    category: Optional[str] = Field("general", max_length=50)
    tags: Optional[List[str]] = Field(default_factory=list)


class PostUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    content: Optional[str] = Field(None, min_length=5, max_length=30000)
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None


class CommentCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    parent_id: Optional[str] = None


class CommentUpdateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)


def sanitize_input(text: str) -> str:
    """Basic XSS mitigation while preserving standard characters."""
    if not text:
        return ""
    # Strip dangerous HTML script tags
    cleaned = text.replace("<script", "&lt;script").replace("</script>", "&lt;/script&gt;")
    cleaned = cleaned.replace("javascript:", "blocked:")
    return cleaned.strip()


# -------------------------------------------------------------
# Community API Endpoints
# -------------------------------------------------------------

@router.get("/posts")
def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query("latest", regex="^(latest|popular|most_commented)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    List community discussions with pagination, category filter, search, and sorting.
    Returns has_liked flag when user is authenticated.
    """
    query = db.query(CommunityPost)

    # Filter by category
    if category and category.lower() != "all":
        query = query.filter(func.lower(CommunityPost.category) == category.lower())

    # Search filter (title, content, tags)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(CommunityPost.title).like(term),
                func.lower(CommunityPost.content).like(term),
                func.lower(CommunityPost.tags).like(term),
                func.lower(CommunityPost.author_name).like(term)
            )
        )

    # Sorting
    if sort == "popular":
        query = query.order_by(desc(CommunityPost.is_pinned), desc(CommunityPost.likes_count), desc(CommunityPost.created_at))
    elif sort == "most_commented":
        query = query.order_by(desc(CommunityPost.is_pinned), desc(CommunityPost.comments_count), desc(CommunityPost.created_at))
    else:  # latest
        query = query.order_by(desc(CommunityPost.is_pinned), desc(CommunityPost.created_at))

    total = query.count()
    offset = (page - 1) * limit
    posts = query.offset(offset).limit(limit).all()

    # Determine which posts current_user has liked in a single query
    user_liked_post_ids = set()
    current_user_id = current_user.id if current_user else None
    if current_user_id and posts:
        post_ids = [p.id for p in posts]
        likes = db.query(CommunityLike.post_id).filter(
            CommunityLike.user_id == current_user_id,
            CommunityLike.post_id.in_(post_ids)
        ).all()
        user_liked_post_ids = {l[0] for l in likes}

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "posts": [
            p.to_dict(
                current_user_id=current_user_id,
                has_liked=(p.id in user_liked_post_ids)
            )
            for p in posts
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.get("/posts/{post_id}")
def get_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Fetch a single community post by ID, incrementing view count.
    Includes comments thread.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Community post not found")

    # Increment view count
    try:
        post.views_count = (post.views_count or 0) + 1
        db.commit()
    except Exception:
        db.rollback()

    current_user_id = current_user.id if current_user else None
    has_liked = False
    if current_user_id:
        has_liked = db.query(CommunityLike).filter(
            CommunityLike.post_id == post_id,
            CommunityLike.user_id == current_user_id
        ).first() is not None

    # Fetch comments
    comments = db.query(CommunityComment).filter(
        CommunityComment.post_id == post_id
    ).order_by(asc(CommunityComment.created_at)).all()

    post_dict = post.to_dict(current_user_id=current_user_id, has_liked=has_liked)
    post_dict["comments"] = [c.to_dict(current_user_id=current_user_id) for c in comments]

    return post_dict


@router.post("/posts", status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new community discussion post."""
    clean_title = sanitize_input(payload.title)
    clean_content = sanitize_input(payload.content)
    clean_category = (payload.category or "general").strip().lower()

    if len(clean_title) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title must be at least 3 characters.")
    if len(clean_content) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content must be at least 5 characters.")

    tags_json = json.dumps([t.strip().lower() for t in payload.tags if t.strip()]) if payload.tags else "[]"

    new_post = CommunityPost(
        id=f"post-{uuid.uuid4().hex[:12]}",
        user_id=current_user.id,
        workspace_id=current_user.workspace_id,
        author_name=current_user.full_name or current_user.email.split("@")[0],
        author_email=current_user.email,
        author_role=current_user.role or "Developer",
        author_avatar=current_user.avatar_url,
        title=clean_title,
        content=clean_content,
        category=clean_category,
        tags=tags_json,
        likes_count=0,
        comments_count=0,
        views_count=1,
        is_pinned=False,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Emit notification
    try:
        emit_notification(
            db=db,
            user_id=current_user.id,
            title="Post Published",
            desc=f"Your community discussion '{clean_title[:40]}...' is live.",
            type="success",
            link="/community"
        )
    except Exception:
        pass

    return new_post.to_dict(current_user_id=current_user.id, has_liked=False)


@router.put("/posts/{post_id}")
def update_post(
    post_id: str,
    payload: PostUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit own community post (or admin moderation)."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    is_admin = current_user.role in ["Admin", "SuperAdmin"]
    if post.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this post")

    if payload.title is not None:
        clean_title = sanitize_input(payload.title)
        if len(clean_title) < 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title must be at least 3 characters")
        post.title = clean_title

    if payload.content is not None:
        clean_content = sanitize_input(payload.content)
        if len(clean_content) < 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Content must be at least 5 characters")
        post.content = clean_content

    if payload.category is not None:
        post.category = payload.category.strip().lower()

    if payload.tags is not None:
        post.tags = json.dumps([t.strip().lower() for t in payload.tags if t.strip()])

    post.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(post)

    has_liked = db.query(CommunityLike).filter(
        CommunityLike.post_id == post_id,
        CommunityLike.user_id == current_user.id
    ).first() is not None

    return post.to_dict(current_user_id=current_user.id, has_liked=has_liked)


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete own community post (or admin moderation). Cascades comments and likes."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    is_admin = current_user.role in ["Admin", "SuperAdmin"]
    if post.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this post")

    # Cascade delete comments & likes
    db.query(CommunityComment).filter(CommunityComment.post_id == post_id).delete()
    db.query(CommunityLike).filter(CommunityLike.post_id == post_id).delete()
    db.delete(post)
    db.commit()

    return {"success": True, "message": "Post deleted successfully", "deleted_id": post_id}


@router.post("/posts/{post_id}/like")
def toggle_like_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle like/unlike on a community post.
    Enforces uniqueness: users cannot like multiple times.
    """
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    existing_like = db.query(CommunityLike).filter(
        CommunityLike.post_id == post_id,
        CommunityLike.user_id == current_user.id
    ).first()

    if existing_like:
        # Unlike
        db.delete(existing_like)
        post.likes_count = max(0, (post.likes_count or 1) - 1)
        db.commit()
        return {"liked": False, "likes_count": post.likes_count}
    else:
        # Like
        new_like = CommunityLike(
            id=f"like-{uuid.uuid4().hex[:12]}",
            post_id=post_id,
            user_id=current_user.id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_like)
        post.likes_count = (post.likes_count or 0) + 1
        db.commit()
        return {"liked": True, "likes_count": post.likes_count}


@router.get("/posts/{post_id}/comments")
def get_comments(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get all comments for a post."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    current_user_id = current_user.id if current_user else None
    comments = db.query(CommunityComment).filter(
        CommunityComment.post_id == post_id
    ).order_by(asc(CommunityComment.created_at)).all()

    return [c.to_dict(current_user_id=current_user_id) for c in comments]


@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: str,
    payload: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a comment to a community post."""
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    clean_content = sanitize_input(payload.content)
    if len(clean_content) < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment content cannot be empty")

    comment = CommunityComment(
        id=f"comment-{uuid.uuid4().hex[:12]}",
        post_id=post_id,
        user_id=current_user.id,
        parent_id=payload.parent_id,
        author_name=current_user.full_name or current_user.email.split("@")[0],
        author_email=current_user.email,
        author_role=current_user.role or "Developer",
        author_avatar=current_user.avatar_url,
        content=clean_content,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )

    db.add(comment)
    post.comments_count = (post.comments_count or 0) + 1
    db.commit()
    db.refresh(comment)

    return comment.to_dict(current_user_id=current_user.id)


@router.put("/comments/{comment_id}")
def update_comment(
    comment_id: str,
    payload: CommentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit own comment (or admin moderation)."""
    comment = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_admin = current_user.role in ["Admin", "SuperAdmin"]
    if comment.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to edit this comment")

    clean_content = sanitize_input(payload.content)
    if len(clean_content) < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment content cannot be empty")

    comment.content = clean_content
    comment.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(comment)

    return comment.to_dict(current_user_id=current_user.id)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete own comment (or admin moderation)."""
    comment = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_admin = current_user.role in ["Admin", "SuperAdmin"]
    if comment.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this comment")

    post = db.query(CommunityPost).filter(CommunityPost.id == comment.post_id).first()
    if post:
        post.comments_count = max(0, (post.comments_count or 1) - 1)

    db.delete(comment)
    db.commit()

    return {"success": True, "message": "Comment deleted", "deleted_id": comment_id}


@router.get("/stats")
def get_community_stats(db: Session = Depends(get_db)):
    """Summary statistics for the community hub."""
    total_posts = db.query(func.count(CommunityPost.id)).scalar() or 0
    total_comments = db.query(func.count(CommunityComment.id)).scalar() or 0
    total_likes = db.query(func.count(CommunityLike.id)).scalar() or 0
    
    categories = [
        {"id": "all", "label": "All Discussions", "count": total_posts},
        {"id": "general", "label": "General", "count": db.query(func.count(CommunityPost.id)).filter(CommunityPost.category == "general").scalar() or 0},
        {"id": "announcements", "label": "Announcements", "count": db.query(func.count(CommunityPost.id)).filter(CommunityPost.category == "announcements").scalar() or 0},
        {"id": "architecture", "label": "Architecture", "count": db.query(func.count(CommunityPost.id)).filter(CommunityPost.category == "architecture").scalar() or 0},
        {"id": "troubleshooting", "label": "Troubleshooting", "count": db.query(func.count(CommunityPost.id)).filter(CommunityPost.category == "troubleshooting").scalar() or 0},
        {"id": "showcase", "label": "Showcase", "count": db.query(func.count(CommunityPost.id)).filter(CommunityPost.category == "showcase").scalar() or 0},
    ]

    return {
        "engineers_count": "12,400+",
        "contributors_count": "480+",
        "total_discussions": total_posts,
        "total_comments": total_comments,
        "total_likes": total_likes,
        "categories": categories
    }
