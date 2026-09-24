from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.arvevents.models import ArvEventQueue, ArvQueueMessage, ArvEventTopic, ArvEventRule
import datetime

router = APIRouter(prefix="/api/v1/events", tags=["ArvEvents"])

class CreateQueueRequest(BaseModel):
    name: str
    queue_type: str = "STANDARD"
    visibility_timeout_seconds: int = 30
    message_retention_days: int = 4

class SendMessageRequest(BaseModel):
    body: str
    attributes: dict = {}

class CreateTopicRequest(BaseModel):
    name: str
    description: Optional[str] = None

class PublishMessageRequest(BaseModel):
    message: str
    attributes: dict = {}

class CreateRuleRequest(BaseModel):
    topic_id: str
    name: str
    pattern: dict
    target_type: str
    target_id: str

@router.get("/queues")
def list_queues(db: Session = Depends(get_db)):
    queues = db.query(ArvEventQueue).all()
    return [q.to_dict() for q in queues]

@router.post("/queues")
def create_queue(req: CreateQueueRequest, db: Session = Depends(get_db)):
    queue = ArvEventQueue(
        name=req.name,
        queue_type=req.queue_type,
        visibility_timeout_seconds=req.visibility_timeout_seconds,
        message_retention_days=req.message_retention_days
    )
    db.add(queue)
    db.commit()
    db.refresh(queue)
    return queue.to_dict()

@router.get("/queues/{id}")
def get_queue(id: str, db: Session = Depends(get_db)):
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    return queue.to_dict()

@router.delete("/queues/{id}")
def delete_queue(id: str, db: Session = Depends(get_db)):
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    db.delete(queue)
    db.commit()
    return {"status": "deleted"}

@router.post("/queues/{id}/messages")
def send_message(id: str, req: SendMessageRequest, db: Session = Depends(get_db)):
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    msg = ArvQueueMessage(
        queue_id=id,
        body=req.body,
        attributes=req.attributes,
        status="AVAILABLE"
    )
    queue.message_count += 1
    db.add(msg)
    db.commit()
    return {"message_id": msg.id}

@router.get("/queues/{id}/messages")
def receive_message(id: str, db: Session = Depends(get_db)):
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    
    msg = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.queue_id == id,
        ArvQueueMessage.status == "AVAILABLE"
    ).first()
    
    if not msg:
        return []
    
    msg.status = "IN_FLIGHT"
    msg.receive_count += 1
    msg.last_received_at = datetime.datetime.utcnow()
    msg.visibility_deadline = datetime.datetime.utcnow() + datetime.timedelta(seconds=queue.visibility_timeout_seconds)
    db.commit()
    
    return [msg.to_dict()]

@router.post("/queues/{id}/purge")
def purge_queue(id: str, db: Session = Depends(get_db)):
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    db.query(ArvQueueMessage).filter(ArvQueueMessage.queue_id == id).delete()
    queue.message_count = 0
    db.commit()
    return {"status": "purged"}

@router.get("/queues/{id}/dlq")
def get_dlq_messages(id: str, db: Session = Depends(get_db)):
    msgs = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.queue_id == id,
        ArvQueueMessage.status == "DLQ"
    ).all()
    return [m.to_dict() for m in msgs]

@router.get("/topics")
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(ArvEventTopic).all()
    return [t.to_dict() for t in topics]

@router.post("/topics")
def create_topic(req: CreateTopicRequest, db: Session = Depends(get_db)):
    topic = ArvEventTopic(name=req.name, description=req.description)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic.to_dict()

@router.delete("/topics/{id}")
def delete_topic(id: str, db: Session = Depends(get_db)):
    topic = db.query(ArvEventTopic).filter(ArvEventTopic.id == id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return {"status": "deleted"}

@router.post("/topics/{id}/publish")
def publish_message(id: str, req: PublishMessageRequest, db: Session = Depends(get_db)):
    topic = db.query(ArvEventTopic).filter(ArvEventTopic.id == id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    topic.message_count += 1
    db.commit()
    return {"status": "published", "topic_id": id}

@router.get("/rules")
def list_rules(db: Session = Depends(get_db)):
    rules = db.query(ArvEventRule).all()
    return [r.to_dict() for r in rules]

@router.post("/rules")
def create_rule(req: CreateRuleRequest, db: Session = Depends(get_db)):
    rule = ArvEventRule(
        topic_id=req.topic_id,
        name=req.name,
        pattern=req.pattern,
        target_type=req.target_type,
        target_id=req.target_id
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule.to_dict()

@router.put("/rules/{id}")
def update_rule(id: str, req: CreateRuleRequest, db: Session = Depends(get_db)):
    rule = db.query(ArvEventRule).filter(ArvEventRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.name = req.name
    rule.pattern = req.pattern
    rule.target_type = req.target_type
    rule.target_id = req.target_id
    db.commit()
    return rule.to_dict()

@router.delete("/rules/{id}")
def delete_rule(id: str, db: Session = Depends(get_db)):
    rule = db.query(ArvEventRule).filter(ArvEventRule.id == id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"status": "deleted"}
