from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Club, Event
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.security import get_current_active_user, require_manager_or_admin


router = APIRouter(
    prefix="/events",
    tags=["events"],
)


@router.post("", response_model=EventResponse, status_code=201)
@router.post("/", response_model=EventResponse, status_code=201)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    club = db.get(Club, event.club_id)

    if club is None:
        raise HTTPException(
            status_code=404,
            detail="Club not found",
        )

    new_event = Event(
        title=event.title,
        description=event.description,
        starts_at=event.starts_at,
        club_id=event.club_id,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event


@router.get("", response_model=list[EventResponse])
@router.get("/", response_model=list[EventResponse])
def get_events(
    club_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(Event)
    if club_id is not None:
        stmt = stmt.where(Event.club_id == club_id)
    return db.scalars(
        stmt.order_by(Event.starts_at, Event.id)
    ).all()


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    return event


@router.put("/{event_id}", response_model=EventResponse)
@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    if event_data.title is not None:
        event.title = event_data.title

    if event_data.description is not None:
        event.description = event_data.description

    if event_data.starts_at is not None:
        event.starts_at = event_data.starts_at

    if event_data.club_id is not None:
        club = db.get(Club, event_data.club_id)

        if club is None:
            raise HTTPException(
                status_code=404,
                detail="Club not found",
            )

        event.club_id = event_data.club_id

    db.commit()
    db.refresh(event)

    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    event = db.get(Event, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found",
        )

    db.delete(event)
    db.commit()