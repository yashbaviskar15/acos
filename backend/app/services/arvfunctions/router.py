from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.arvfunctions.models import ArvFunction, ArvFunctionInvocation
import datetime
import random

router = APIRouter(prefix="/api/v1/functions", tags=["ArvFunctions"])

class CreateFunctionRequest(BaseModel):
    name: str
    runtime: str = "python3.11"
    handler: str
    memory_mb: int = 256
    timeout_seconds: int = 30
    trigger_type: str = "http"
    env_vars: dict = {}

class InvokeFunctionRequest(BaseModel):
    payload: dict = {}

@router.get("/")
def list_functions(project_id: Optional[str] = None, runtime: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ArvFunction)
    if project_id:
        query = query.filter(ArvFunction.project_id == project_id)
    if runtime:
        query = query.filter(ArvFunction.runtime == runtime)
    if status:
        query = query.filter(ArvFunction.status == status)
    return [fn.to_dict() for fn in query.all()]

@router.post("/")
def create_function(req: CreateFunctionRequest, db: Session = Depends(get_db)):
    fn = ArvFunction(
        name=req.name,
        runtime=req.runtime,
        handler=req.handler,
        memory_mb=req.memory_mb,
        timeout_seconds=req.timeout_seconds,
        trigger_type=req.trigger_type,
        env_vars=req.env_vars
    )
    db.add(fn)
    db.commit()
    db.refresh(fn)
    return fn.to_dict()

@router.get("/{function_id}")
def get_function(function_id: str, db: Session = Depends(get_db)):
    fn = db.query(ArvFunction).filter(ArvFunction.id == function_id).first()
    if not fn:
        raise HTTPException(status_code=404, detail="Function not found")
    return fn.to_dict()

@router.put("/{function_id}")
def update_function(function_id: str, req: CreateFunctionRequest, db: Session = Depends(get_db)):
    fn = db.query(ArvFunction).filter(ArvFunction.id == function_id).first()
    if not fn:
        raise HTTPException(status_code=404, detail="Function not found")
    fn.name = req.name
    fn.runtime = req.runtime
    fn.handler = req.handler
    fn.memory_mb = req.memory_mb
    fn.timeout_seconds = req.timeout_seconds
    fn.trigger_type = req.trigger_type
    fn.env_vars = req.env_vars
    fn.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(fn)
    return fn.to_dict()

@router.delete("/{function_id}")
def delete_function(function_id: str, db: Session = Depends(get_db)):
    fn = db.query(ArvFunction).filter(ArvFunction.id == function_id).first()
    if not fn:
        raise HTTPException(status_code=404, detail="Function not found")
    db.delete(fn)
    db.commit()
    return {"status": "deleted"}

@router.post("/{function_id}/invoke")
def invoke_function(function_id: str, req: InvokeFunctionRequest, db: Session = Depends(get_db)):
    fn = db.query(ArvFunction).filter(ArvFunction.id == function_id).first()
    if not fn:
        raise HTTPException(status_code=404, detail="Function not found")
    
    duration = random.randint(50, 500)
    fn.invocation_count += 1
    fn.last_invoked_at = datetime.datetime.utcnow()
    
    inv = ArvFunctionInvocation(
        function_id=fn.id,
        status="SUCCESS",
        duration_ms=duration,
        billed_duration_ms=((duration // 100) + 1) * 100,
        memory_used_mb=random.randint(20, fn.memory_mb),
        request_payload=str(req.payload),
        response_payload='{"message": "success"}',
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv.to_dict()

@router.get("/{function_id}/invocations")
def list_invocations(function_id: str, db: Session = Depends(get_db)):
    invs = db.query(ArvFunctionInvocation).filter(ArvFunctionInvocation.function_id == function_id).order_by(ArvFunctionInvocation.timestamp.desc()).all()
    return [inv.to_dict() for inv in invs]

@router.get("/{function_id}/metrics")
def get_metrics(function_id: str, db: Session = Depends(get_db)):
    fn = db.query(ArvFunction).filter(ArvFunction.id == function_id).first()
    if not fn:
        raise HTTPException(status_code=404, detail="Function not found")
    
    invs = db.query(ArvFunctionInvocation).filter(ArvFunctionInvocation.function_id == function_id).all()
    if not invs:
        return {"invocation_count": 0, "avg_duration_ms": 0, "error_rate": 0.0, "p95_latency": 0}
        
    durations = sorted([i.duration_ms for i in invs])
    errors = sum([1 for i in invs if i.status != "SUCCESS"])
    
    idx_p95 = int(len(durations) * 0.95)
    idx_p95 = min(idx_p95, len(durations) - 1)
    
    return {
        "invocation_count": len(invs),
        "avg_duration_ms": sum(durations) / len(durations),
        "error_rate": errors / len(invs),
        "p95_latency": durations[idx_p95] if durations else 0
    }
