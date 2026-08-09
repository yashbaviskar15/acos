from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from app.core.config import settings
from app.core.database import Base, engine
from app.services.arvgate.router import router as arvgate_router
from app.services.arvcompute.router import router as arvcompute_router
from app.services.arvkube.router import router as arvkube_router
from app.services.arvstore.router import router as arvstore_router
from app.services.arvdb.router import router as arvdb_router
from app.services.arvregistry.router import router as arvregistry_router
from app.services.arvedge.router import router as arvedge_router
from app.services.arvwatch.router import router as arvwatch_router
from app.services.arvcicd.router import router as arvcicd_router
from app.services.arvbilling.router import router as arvbilling_router

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local frontend dev & gateway
allowed_origins = [
    "https://acos-taupe.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Include Arv* Service Routers (Routers already include /api/v1 in their prefix)
app.include_router(arvgate_router)
app.include_router(arvcompute_router)
app.include_router(arvkube_router)
app.include_router(arvstore_router)
app.include_router(arvdb_router)
app.include_router(arvregistry_router)
app.include_router(arvedge_router)
app.include_router(arvwatch_router)
app.include_router(arvcicd_router)
app.include_router(arvbilling_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Aravanta CloudOS Microservices API",
        "version": settings.VERSION
    }
