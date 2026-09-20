from pydantic import BaseModel, ConfigDict, EmailStr


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    club_id: int


class MemberUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class MemberResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    club_id: int

    model_config = ConfigDict(from_attributes=True)