from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Attendance, Event, Member
from app.models.user import User
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse,
    AttendanceUpdate,
)
from app.security import get_current_active_user, require_manager_or_admin

router = APIRouter(
    prefix="/attendance",
    tags=["attendance"],
)


def ensure_member(db: Session, member_id: int) -> Member:
    member = db.get(Member, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Member not found",
        )

    return member


def ensure_event(db: Session, event_id: int) -> Event:
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    return event


def find_duplicate(
    db: Session,
    member_id: int,
    event_id: int,
    exclude_id: int | None = None,
) -> Attendance | None:
    query = select(Attendance).where(
        Attendance.member_id == member_id,
        Attendance.event_id == event_id,
    )

    if exclude_id is not None:
        query = query.where(Attendance.id != exclude_id)

    return db.scalar(query)


@router.post("", response_model=AttendanceResponse, status_code=201)
@router.post("/", response_model=AttendanceResponse, status_code=201)
def create_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    ensure_member(db, attendance.member_id)
    ensure_event(db, attendance.event_id)

    if find_duplicate(
        db,
        attendance.member_id,
        attendance.event_id,
    ):
        raise HTTPException(
            status_code=409,
            detail="Attendance already exists for this member and event",
        )

    record = Attendance(
        member_id=attendance.member_id,
        event_id=attendance.event_id,
        present=attendance.present,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get("", response_model=list[AttendanceResponse])
@router.get("/", response_model=list[AttendanceResponse])
def get_attendance(
    member_id: int | None = None,
    event_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(Attendance)
    if member_id is not None:
        stmt = stmt.where(Attendance.member_id == member_id)
    if event_id is not None:
        stmt = stmt.where(Attendance.event_id == event_id)
    return db.scalars(
        stmt.order_by(Attendance.id)
    ).all()


@router.get("/member/{member_id}", response_model=list[AttendanceResponse])
def get_member_attendance(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ensure_member(db, member_id)

    return db.scalars(
        select(Attendance)
        .where(Attendance.member_id == member_id)
        .order_by(Attendance.id)
    ).all()


@router.get("/event/{event_id}", response_model=list[AttendanceResponse])
def get_event_attendance(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ensure_event(db, event_id)

    return db.scalars(
        select(Attendance)
        .where(Attendance.event_id == event_id)
        .order_by(Attendance.id)
    ).all()


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance_record(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    record = db.get(Attendance, attendance_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found",
        )

    return record


@router.put("/{attendance_id}", response_model=AttendanceResponse)
@router.patch("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    record = db.get(Attendance, attendance_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found",
        )

    member_id = (
        attendance_data.member_id
        if attendance_data.member_id is not None
        else record.member_id
    )

    event_id = (
        attendance_data.event_id
        if attendance_data.event_id is not None
        else record.event_id
    )

    ensure_member(db, member_id)
    ensure_event(db, event_id)

    if find_duplicate(
        db,
        member_id,
        event_id,
        exclude_id=attendance_id,
    ):
        raise HTTPException(
            status_code=409,
            detail="Attendance already exists for this member and event",
        )

    record.member_id = member_id
    record.event_id = event_id

    if attendance_data.present is not None:
        record.present = attendance_data.present

    db.commit()
    db.refresh(record)

    return record


@router.delete("/{attendance_id}", status_code=204)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    record = db.get(Attendance, attendance_id)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found",
        )

    db.delete(record)
    db.commit()