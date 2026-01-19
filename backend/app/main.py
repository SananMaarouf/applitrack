from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes import applications, health, status_flow

app = FastAPI(title="AppliTrack API")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] ,
)

app.include_router(health.router)
app.include_router(applications.router)
app.include_router(status_flow.router)
