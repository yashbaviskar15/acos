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
    
    now = datetime.datetime.utcnow()
    expired = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.queue_id == id,
        ArvQueueMessage.status == "IN_FLIGHT",
        ArvQueueMessage.visibility_deadline < now
    ).all()
    for m in expired:
        if queue.dlq_target_id and m.receive_count >= queue.dlq_max_receive_count:
            m.status = "DLQ"
        else:
            m.status = "AVAILABLE"
    db.commit()
    
    msg = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.queue_id == id,
        ArvQueueMessage.status == "AVAILABLE"
    ).first()
    
    if not msg:
        return []
    
    msg.receive_count += 1
    if queue.dlq_target_id and msg.receive_count > queue.dlq_max_receive_count:
        msg.status = "DLQ"
        db.commit()
        return []

    msg.status = "IN_FLIGHT"
    msg.last_received_at = now
    msg.visibility_deadline = now + datetime.timedelta(seconds=queue.visibility_timeout_seconds)
    db.commit()
    
    return [msg.to_dict()]

@router.delete("/queues/{id}/messages/{message_id}")
def acknowledge_message(id: str, message_id: str, db: Session = Depends(get_db)):
    """Acknowledge (delete) a message after successful processing."""
    msg = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.id == message_id,
        ArvQueueMessage.queue_id == id
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if queue:
        queue.message_count = max(0, queue.message_count - 1)
    db.delete(msg)
    db.commit()
    return {"status": "acknowledged", "message_id": message_id}

@router.post("/queues/{id}/receive-batch")
def receive_message_batch(id: str, max_messages: int = Query(1, alias="max_messages"), db: Session = Depends(get_db)):
    queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == id).first()
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    
    now = datetime.datetime.utcnow()
    expired = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.queue_id == id,
        ArvQueueMessage.status == "IN_FLIGHT",
        ArvQueueMessage.visibility_deadline < now
    ).all()
    for m in expired:
        if queue.dlq_target_id and m.receive_count >= queue.dlq_max_receive_count:
            m.status = "DLQ"
        else:
            m.status = "AVAILABLE"
    db.commit()
    
    msgs = db.query(ArvQueueMessage).filter(
        ArvQueueMessage.queue_id == id,
        ArvQueueMessage.status == "AVAILABLE"
    ).limit(max_messages).all()
    
    if not msgs:
        return []
        
    result = []
    for msg in msgs:
        msg.receive_count += 1
        if queue.dlq_target_id and msg.receive_count > queue.dlq_max_receive_count:
            msg.status = "DLQ"
        else:
            msg.status = "IN_FLIGHT"
            msg.last_received_at = now
            msg.visibility_deadline = now + datetime.timedelta(seconds=queue.visibility_timeout_seconds)
            result.append(msg.to_dict())
    
    db.commit()
    return result

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
    
    rules = db.query(ArvEventRule).filter(
        ArvEventRule.topic_id == id,
        ArvEventRule.enabled == True
    ).all()
    for rule in rules:
        if rule.target_type == "QUEUE":
            target_queue = db.query(ArvEventQueue).filter(ArvEventQueue.id == rule.target_id).first()
            if target_queue:
                msg = ArvQueueMessage(
                    queue_id=target_queue.id,
                    body=req.message,
                    attributes=req.attributes,
                    status="AVAILABLE"
                )
                target_queue.message_count += 1
                db.add(msg)
                
    db.commit()
    return {"status": "published", "topic_id": id}

class SubscribeTopicRequest(BaseModel):
    target_type: str
    target_id: str
    name: str = ""
    pattern: dict = {}

@router.post("/topics/{id}/subscribe")
def subscribe_topic(id: str, req: SubscribeTopicRequest, db: Session = Depends(get_db)):
    topic = db.query(ArvEventTopic).filter(ArvEventTopic.id == id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    rule = ArvEventRule(
        topic_id=id,
        name=req.name or f"sub-{req.target_type}-{req.target_id}",
        pattern=req.pattern,
        target_type=req.target_type,
        target_id=req.target_id,
        enabled=True
    )
    topic.subscription_count += 1
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule.to_dict()

@router.get("/topics/{id}/subscriptions")
def list_topic_subscriptions(id: str, db: Session = Depends(get_db)):
    topic = db.query(ArvEventTopic).filter(ArvEventTopic.id == id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    rules = db.query(ArvEventRule).filter(ArvEventRule.topic_id == id).all()
    return [r.to_dict() for r in rules]

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
