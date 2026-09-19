from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Club
from app.schemas.club import ClubCreate, ClubResponse


router = APIRouter(
    prefix="/clubs",
    tags=["clubs"],
)


@router.post("/", response_model=ClubResponse, status_code=201)
def create_club(
    club: ClubCreate,
    db: Session = Depends(get_db),
):
    new_club = Club(
        name=club.name,
        description=club.description,
    )

    db.add(new_club)

    try:
        db.commit()
        db.refresh(new_club)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A club with this name already exists",
        )

    return new_club


@router.get("/", response_model=list[ClubResponse])
def get_clubs(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Club).order_by(Club.id)
    ).all()


@router.get("/{club_id}", response_model=ClubResponse)
def get_club(
    club_id: int,
    db: Session = Depends(get_db),
):
    club = db.get(Club, club_id)

    if club is None:
        raise HTTPException(
            status_code=404,
            detail="Club not found",
        )

    return club