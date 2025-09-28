from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from routers import SearchRouter, ManagementRouter, UserProfileRouter
from routers.image_proxy import router as ImageProxyRouter
from routers.auth import router as AuthRouter
from shared.config import settings
from shared.database import create_db_and_tables
from shared.migrations import run_migrations


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run database migrations on startup
    print("Starting database migrations...")
    migration_success = run_migrations()
    if migration_success:
        print("Database migrations completed successfully")
    else:
        print("Database migrations failed - check logs")
    yield

def run_app(db_url=None):
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    app.include_router(SearchRouter)
    app.include_router(ManagementRouter)
    app.include_router(UserProfileRouter)
    app.include_router(ImageProxyRouter)
    app.include_router(AuthRouter)

    return app

app = run_app()