import os
from pathlib import Path
from fastapi import FastAPI, Request, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings

# Import API Routers
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.organizations import router as organizations_router
from app.api.sites import router as sites_router
from app.api.machines import router as machines_router
from app.api.technicians import router as technicians_router
from app.api.skills import router as skills_router
from app.api.spare_parts import router as spare_parts_router
from app.api.inventory import router as inventory_router
from app.api.service_requests import router as service_requests_router
from app.api.assignments import router as assignments_router
from app.api.service_tasks import router as service_tasks_router
from app.api.evidence import router as evidence_router
from app.api.exceptions import router as exceptions_router
from app.api.recovery import router as recovery_router
from app.api.simulations import router as simulations_router
from app.api.notifications import router as notifications_router
from app.api.audit_logs import router as audit_logs_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Industrial Resilience Operating System: See the disruption. Simulate the future. Orchestrate the recovery.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Centralized Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected server error occurred.",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "Internal server error",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_manager = ConnectionManager()

@app.websocket("/api/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or heartbeat
            await websocket.send_json({"type": "PONG", "data": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Include Routers under /api
api_prefix = "/api"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(organizations_router, prefix=api_prefix)
app.include_router(sites_router, prefix=api_prefix)
app.include_router(machines_router, prefix=api_prefix)
app.include_router(technicians_router, prefix=api_prefix)
app.include_router(skills_router, prefix=api_prefix)
app.include_router(spare_parts_router, prefix=api_prefix)
app.include_router(inventory_router, prefix=api_prefix)
app.include_router(service_requests_router, prefix=api_prefix)
app.include_router(assignments_router, prefix=api_prefix)
app.include_router(service_tasks_router, prefix=api_prefix)
app.include_router(evidence_router, prefix=api_prefix)
app.include_router(exceptions_router, prefix=api_prefix)
app.include_router(recovery_router, prefix=api_prefix)
app.include_router(simulations_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(audit_logs_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)

# Health endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "MORPHIX — Industrial Resilience OS API",
        "docs": "/docs",
        "health": "/api/health"
    }
