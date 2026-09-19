from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from .common import ActionType, Priority, TaskStatus


class CreateTaskParameters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1)
    description: str | None = None
    assignee: str | None = None
    deadline: date | None = None
    priority: Priority = Priority.MEDIUM


class UpdateTaskParameters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    task_id: str
    title: str | None = None
    description: str | None = None
    assignee: str | None = None
    deadline: date | None = None
    priority: Priority | None = None
    status: TaskStatus | None = None


class AssignTaskParameters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    task_id: str
    assignee: str = Field(min_length=1)


class UpdateTaskStatusParameters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    task_id: str
    status: TaskStatus


class CreateAnnouncementParameters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1)
    message: str = Field(min_length=1)
    audience: str | None = None


class CreateEventParameters(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    event_name: str = Field(min_length=1)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class CreateTaskAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal[ActionType.CREATE_TASK]
    parameters: CreateTaskParameters
    requires_confirmation: bool = True


class UpdateTaskAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal[ActionType.UPDATE_TASK]
    parameters: UpdateTaskParameters
    requires_confirmation: bool = True


class AssignTaskAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal[ActionType.ASSIGN_TASK]
    parameters: AssignTaskParameters
    requires_confirmation: bool = True


class UpdateTaskStatusAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal[ActionType.UPDATE_TASK_STATUS]
    parameters: UpdateTaskStatusParameters
    requires_confirmation: bool = True


class CreateAnnouncementAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal[ActionType.CREATE_ANNOUNCEMENT]
    parameters: CreateAnnouncementParameters
    requires_confirmation: bool = True


class CreateEventAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal[ActionType.CREATE_EVENT]
    parameters: CreateEventParameters
    requires_confirmation: bool = True


AIAction = Annotated[
    CreateTaskAction
    | UpdateTaskAction
    | AssignTaskAction
    | UpdateTaskStatusAction
    | CreateAnnouncementAction
    | CreateEventAction,
    Field(discriminator="action"),
]
SUPPORTED_ACTIONS = [e.value for e in ActionType]
