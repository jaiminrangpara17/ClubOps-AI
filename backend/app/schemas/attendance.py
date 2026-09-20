from pydantic import BaseModel, ConfigDict


class AttendanceCreate(BaseModel):
    member_id: int
    event_id: int
    present: bool

    model_config = ConfigDict(extra="forbid")


class AttendanceUpdate(BaseModel):
    member_id: int | None = None
    event_id: int | None = None
    present: bool | None = None

    model_config = ConfigDict(extra="forbid")


class AttendanceResponse(BaseModel):
    id: int
    member_id: int
    event_id: int
    present: bool

    model_config = ConfigDict(from_attributes=True)