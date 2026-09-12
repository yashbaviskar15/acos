"""
Aravanta CloudOS — Community Models
SQLAlchemy models for Community Posts, Comments, and Likes.
"""
import uuid
import json
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
)
from app.core.database import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(String(36), primary_key=True, index=True, default=lambda: f"post-{uuid.uuid4().hex[:12]}")
    user_id = Column(String(36), index=True, nullable=False)
    workspace_id = Column(String(50), index=True, nullable=True)
    author_name = Column(String(255), nullable=False)
    author_email = Column(String(255), nullable=False)
    author_role = Column(String(50), default="Developer", nullable=False)
    author_avatar = Column(String(500), nullable=True)
    
    title = Column(String(255), index=True, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), index=True, default="general", nullable=False)  # general, announcements, architecture, troubleshooting, showcase
    tags = Column(Text, default="[]", nullable=False)  # JSON array of strings
    images = Column(Text, default="[]", nullable=True)  # JSON array of image URLs or data URIs
    
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self, current_user_id: Optional[str] = None, has_liked: bool = False) -> Dict[str, Any]:
        try:
            parsed_tags = json.loads(self.tags) if self.tags else []
        except Exception:
            parsed_tags = []

        try:
            parsed_images = json.loads(self.images) if self.images else []
        except Exception:
            parsed_images = []
            
        return {
            "id": self.id,
            "user_id": self.user_id,
            "workspace_id": self.workspace_id,
            "author_name": self.author_name,
            "author_email": self.author_email,
            "author_role": self.author_role,
            "author_avatar": self.author_avatar,
            "title": self.title,
            "content": self.content,
            "category": self.category,
            "tags": parsed_tags,
            "images": parsed_images,
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "views_count": self.views_count,
            "is_pinned": self.is_pinned,
            "has_liked": has_liked,
            "is_owner": bool(current_user_id and self.user_id == current_user_id),
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(String(36), primary_key=True, index=True, default=lambda: f"comment-{uuid.uuid4().hex[:12]}")
    post_id = Column(String(36), index=True, nullable=False)
    user_id = Column(String(36), index=True, nullable=False)
    parent_id = Column(String(36), index=True, nullable=True)  # For replies
    
    author_name = Column(String(255), nullable=False)
    author_email = Column(String(255), nullable=False)
    author_role = Column(String(50), default="Developer", nullable=False)
    author_avatar = Column(String(500), nullable=True)
    
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def to_dict(self, current_user_id: Optional[str] = None) -> Dict[str, Any]:
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "parent_id": self.parent_id,
            "author_name": self.author_name,
            "author_email": self.author_email,
            "author_role": self.author_role,
            "author_avatar": self.author_avatar,
            "content": self.content,
            "is_owner": bool(current_user_id and self.user_id == current_user_id),
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + "Z" if self.updated_at else None,
        }


class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(String(36), primary_key=True, index=True, default=lambda: f"like-{uuid.uuid4().hex[:12]}")
    post_id = Column(String(36), index=True, nullable=False)
    user_id = Column(String(36), index=True, nullable=False)
    author_name = Column(String(255), nullable=True)
    author_role = Column(String(50), default="Developer", nullable=True)
    author_avatar = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_community_post_user_like'),
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "post_id": self.post_id,
            "user_id": self.user_id,
            "name": self.author_name or "Engineer",
            "role": self.author_role or "Developer",
            "avatar": self.author_avatar,
            "created_at": self.created_at.isoformat() + "Z" if self.created_at else None,
        }
