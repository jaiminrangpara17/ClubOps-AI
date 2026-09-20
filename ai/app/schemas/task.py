from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from .common import Priority, TaskStatus


class Task(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    owner_name: str | None = None  # nullable = hallucination resistance
    owner_id: str | None = None
    deadline: date | None = None  # nullable
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    dependencies: list[str] = Field(default_factory=list)
