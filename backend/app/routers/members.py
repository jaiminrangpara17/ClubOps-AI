from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Club, Member
from app.schemas.member import (
    MemberCreate,
    MemberResponse,
    MemberUpdate,
)


router = APIRouter(
    prefix="/members",
    tags=["members"],
)


@router.post("/", response_model=MemberResponse, status_code=201)
def create_member(
    member: MemberCreate,
    db: Session = Depends(get_db),
):
    club = db.get(Club, member.club_id)

    if club is None:
        raise HTTPException(
            status_code=404,
            detail="Club not found",
        )

    new_member = Member(
        name=member.name,
        email=member.email,
        club_id=member.club_id,
    )

    db.add(new_member)

    try:
        db.commit()
        db.refresh(new_member)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A member with this email already exists",
        )

    return new_member


@router.get("/", response_model=list[MemberResponse])
def get_members(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Member).order_by(Member.id)
    ).all()


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
):
    member = db.get(Member, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: int,
    member_data: MemberUpdate,
    db: Session = Depends(get_db),
):
    member = db.get(Member, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    if member_data.name is not None:
        member.name = member_data.name

    if member_data.email is not None:
        member.email = member_data.email

    try:
        db.commit()
        db.refresh(member)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="A member with this email already exists",
        )

    return member


@router.delete("/{member_id}", status_code=204)
def delete_member(
    member_id: int,
    db: Session = Depends(get_db),
):
    member = db.get(Member, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    db.delete(member)
    db.commit()