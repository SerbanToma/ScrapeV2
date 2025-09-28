import os
import pathlib

from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

_repo_root = pathlib.Path(__file__).parent.parent.resolve()

_shared_dir = _repo_root.joinpath('shared')
_templates_dir = _shared_dir.joinpath('templates')
_ml_models_dir = _repo_root.joinpath("models")

_db_models_dir = _shared_dir.joinpath('db_models')

_main_app_dir = _repo_root.joinpath('main_api')
_routers_dir = _main_app_dir.joinpath("routers")
_api_models_dir = _main_app_dir.joinpath("models")

_ml_worker_dir = _repo_root.joinpath('ml_worker')
_worker_services_dir = _ml_worker_dir.joinpath('services')
_worker_tasks_dir = _ml_worker_dir.joinpath('tasks')
_ml_model = _ml_models_dir.joinpath("model.pth")


def _parse_allowed_hosts() -> list[str]:
    raw_value = os.getenv("ALLOWED_HOSTS")
    if not raw_value:
        return ['http://localhost:5173', '*']
    try:
        import json
        parsed = json.loads(raw_value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
    except Exception:
        pass
    return [host.strip() for host in raw_value.split(',') if host.strip()]


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/scrapelight")
    REDIS_URL: str = os.getenv("REDIS_URL", 'redis://redis:6379/0')
    ALLOWED_HOSTS: list[str] = Field(default_factory=_parse_allowed_hosts)
    
    # JWT Authentication Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    MAILJET_API_KEY: str = os.getenv("MAILJET_API_KEY")
    MAILJET_SECRET_KEY: str = os.getenv("MAILJET_API_SECRET")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    
    # Path configurations
    root_path: pathlib.Path = Field(default=_repo_root)
    shared_dir: pathlib.Path = Field(default=_shared_dir)
    templates_dir: pathlib.Path = Field(default=_templates_dir)
    routers_dir: pathlib.Path = Field(default=_routers_dir)
    api_models_dir: pathlib.Path = Field(default=_api_models_dir)
    db_models_dir: pathlib.Path = Field(default=_db_models_dir)
    ml_models_dir: pathlib.Path = Field(default=_ml_models_dir)
    ml_worker_dir: pathlib.Path = Field(default=_ml_worker_dir)
    worker_services_dir: pathlib.Path = Field(default=_worker_services_dir)
    worker_tasks_dir: pathlib.Path = Field(default=_worker_tasks_dir)
    ml_model: pathlib.Path = Field(default=_ml_model)

    class Config:
        env_file = ".env"

settings = Settings()