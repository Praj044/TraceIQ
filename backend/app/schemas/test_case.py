
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TestCaseCreate(BaseModel):
    __test__ = False
    endpoint_id: UUID
    name: str = Field(min_length=1, max_length=200)
    expected_status: int = Field(default=200, ge=100, le=599)
    assertions: list[dict] = Field(default_factory=list)


class TestCaseResponse(BaseModel):
    __test__ = False
    id: UUID
    project_id: UUID
    endpoint_id: UUID
    name: str
    expected_status: int
    assertions: list[dict]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

