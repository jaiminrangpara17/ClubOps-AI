from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate, UserResponse
from app.security import (
    create_access_token,
    get_current_active_user,
    hash_password,
    verify_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    # Check duplicate username
    existing_user = db.scalar(select(User).where(User.username == user_in.username))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this username already exists",
        )

    # Check duplicate email
    existing_email = db.scalar(select(User).where(User.email == user_in.email))
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=UserRole.MEMBER.value,
        is_active=True,
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exists with this username or email",
        )

    return new_user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db),
):
    content_type = request.headers.get("content-type", "")
    identifier = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            identifier = body.get("username") or body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload",
            )
    else:
        try:
            form = await request.form()
            identifier = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid form data",
            )

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.scalar(
        select(User).where(
            (User.username == identifier) | (User.email == identifier)
        )
    )

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    return None


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
):
    return current_user
