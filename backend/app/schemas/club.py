from pydantic import BaseModel, ConfigDict, Field


class ClubCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=255,
        description="Club name",
        examples=["Ahmedabad Tech Club"],
    )
    description: str | None = Field(
        default=None,
        max_length=1000,
        description="Club description",
        examples=["Technology and innovation community"],
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


class ClubResponse(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)