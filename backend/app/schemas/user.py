from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=150,
        description="Unique username",
        examples=["johndoe"],
    )
    email: EmailStr = Field(
        description="User email address",
        examples=["john.doe@example.com"],
    )
    full_name: str | None = Field(
        default=None,
        max_length=255,
        description="Full name of user",
        examples=["John Doe"],
    )
    password: str = Field(
        min_length=8,
        max_length=128,
        description="Plaintext password, minimum 8 characters",
        examples=["supersecret123"],
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


class UserUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        max_length=255,
        description="Updated full name",
    )
    email: EmailStr | None = Field(
        default=None,
        description="Updated email",
    )
    role: str | None = Field(
        default=None,
        pattern="^(admin|manager|member)$",
        description="Updated role",
    )
    is_active: bool | None = Field(
        default=None,
        description="Account active status",
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: str | None = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse | None = None


class TokenData(BaseModel):
    username: str | None = None


class LoginRequest(BaseModel):
    username: str | None = Field(
        default=None,
        description="Username for login",
    )
    email: str | None = Field(
        default=None,
        description="Email for login",
    )
    password: str = Field(
        min_length=1,
        max_length=128,
        description="Password",
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
    )
