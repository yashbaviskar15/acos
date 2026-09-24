import uuid
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.services.arvgate.dependencies import get_current_user
from app.services.arvgate.models import User
from app.services.arvnotify.models import ArvNotifyChannel, ArvNotifyMessage

router = APIRouter(prefix="/api/v1/notify", tags=["ArvNotify"])


class ChannelCreate(BaseModel):
    name: str
    channel_type: str = "EMAIL"
    config: Optional[str] = "{}"


class SendMessage(BaseModel):
    channel_id: Optional[str] = None
    subject: str = ""
    body: str


@router.get("/channels")
def list_channels(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ArvNotifyChannel).order_by(ArvNotifyChannel.created_at.desc()).all()


@router.post("/channels", status_code=status.HTTP_201_CREATED)
def create_channel(body: ChannelCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ch = ArvNotifyChannel(name=body.name, channel_type=body.channel_type, config=body.config, user_id=str(user.id))
    db.add(ch); db.commit(); db.refresh(ch)
    return ch


@router.delete("/channels/{channel_id}")
def delete_channel(channel_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ch = db.query(ArvNotifyChannel).filter(ArvNotifyChannel.id == channel_id).first()
    if not ch: raise HTTPException(404, "Channel not found")
    db.delete(ch); db.commit()
    return {"message": "Channel deleted", "id": channel_id}


@router.post("/channels/{channel_id}/verify")
def verify_channel(channel_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ch = db.query(ArvNotifyChannel).filter(ArvNotifyChannel.id == channel_id).first()
    if not ch: raise HTTPException(404, "Channel not found")
    ch.is_verified = True
    db.commit(); db.refresh(ch)
    return {"message": "Channel verified", "channel": ch}


@router.post("/send", status_code=status.HTTP_201_CREATED)
def send_message(body: SendMessage, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    msg = ArvNotifyMessage(channel_id=body.channel_id, subject=body.subject, body=body.body, status="SENT", sent_at=datetime.datetime.utcnow(), user_id=str(user.id))
    db.add(msg); db.commit(); db.refresh(msg)
    return msg


@router.get("/messages")
def list_messages(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(ArvNotifyMessage).order_by(ArvNotifyMessage.created_at.desc()).limit(100).all()


@router.get("/messages/{message_id}")
def get_message(message_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    msg = db.query(ArvNotifyMessage).filter(ArvNotifyMessage.id == message_id).first()
    if not msg: raise HTTPException(404, "Message not found")
    return msg
