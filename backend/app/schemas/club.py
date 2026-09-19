from pydantic import BaseModel, ConfigDict


class ClubCreate(BaseModel):
    name: str
    description: str | None = None


class ClubResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)