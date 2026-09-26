from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.arvfunctions.models import ArvFunction, ArvFunctionInvocation
import datetime
import asyncio
import subprocess
import time
import json
import traceback

router = APIRouter(prefix="/api/v1/functions", tags=["ArvFunctions"])

class CreateFunctionRequest(BaseModel):
    name: str
    runtime: str = "python3.11"
    handler: str
    memory_mb: int = 256
    timeout_seconds: int = 30
    trigger_type: str = "http"
    env_vars: dict = {}
    code: Optional[str] = None

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
        env_vars=req.env_vars,
        code=req.code
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
    fn.code = req.code
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
async def invoke_function(function_id: str, req: InvokeFunctionRequest, db: Session = Depends(get_db)):
    fn = db.query(ArvFunction).filter(ArvFunction.id == function_id).first()
    if not fn:
        raise HTTPException(status_code=404, detail="Function not found")
    if fn.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Function is {fn.status}, not ACTIVE")
    
    if not fn.code:
        # No code to execute — log as error
        inv = ArvFunctionInvocation(
            function_id=fn.id,
            status="FAILED",
            duration_ms=0,
            billed_duration_ms=0,
            memory_used_mb=0,
            request_payload=json.dumps(req.payload),
            response_payload=None,
            error_message="No function code deployed. Upload code via PUT /functions/{id}",
        )
        db.add(inv)
        db.commit()
        return inv.to_dict()
    
    # Prepare sandboxed execution
    payload_json = json.dumps(req.payload)
    wrapper = f"""
import json, sys
event = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {{}}
{fn.code}
result = {fn.handler.split('.')[0] if '.' in fn.handler else fn.handler}(event, {{}})
print(json.dumps(result) if result is not None else '{{}}')
"""
    
    start_time = time.monotonic()
    try:
        proc = subprocess.run(
            ["python3", "-c", wrapper, payload_json],
            capture_output=True,
            text=True,
            timeout=min(fn.timeout_seconds, 30),  # cap at 30s on serverless
            env={"PATH": "/usr/bin:/bin"},  # minimal env
        )
        duration_ms = int((time.monotonic() - start_time) * 1000)
        
        if proc.returncode == 0:
            inv_status = "SUCCESS"
            response = proc.stdout.strip()
            error = None
        else:
            inv_status = "FAILED"
            response = proc.stdout.strip() or None
            error = proc.stderr.strip() or f"Exit code {proc.returncode}"
    except subprocess.TimeoutExpired:
        duration_ms = fn.timeout_seconds * 1000
        inv_status = "TIMEOUT"
        response = None
        error = f"Function timed out after {fn.timeout_seconds}s"
    except Exception as e:
        duration_ms = int((time.monotonic() - start_time) * 1000)
        inv_status = "FAILED"
        response = None
        error = str(e)
    
    billed = ((duration_ms // 100) + 1) * 100
    
    fn.invocation_count += 1
    fn.last_invoked_at = datetime.datetime.utcnow()
    
    inv = ArvFunctionInvocation(
        function_id=fn.id,
        status=inv_status,
        duration_ms=duration_ms,
        billed_duration_ms=billed,
        memory_used_mb=0,  # Real memory tracking not available in subprocess
        request_payload=payload_json,
        response_payload=response,
        error_message=error,
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
