from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    base_url: HttpUrl | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    base_url: HttpUrl | None = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    base_url: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
