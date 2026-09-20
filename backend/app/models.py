from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Club(Base):
    __tablename__ = "clubs"

    __table_args__ = (
        UniqueConstraint("name", name="uq_clubs_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    members: Mapped[list["Member"]] = relationship(
        back_populates="club",
        cascade="all, delete-orphan",
    )
    events: Mapped[list["Event"]] = relationship(
        back_populates="club",
        cascade="all, delete-orphan",
    )


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    club_id: Mapped[int] = mapped_column(
        ForeignKey("clubs.id"),
        nullable=False,
    )

    club: Mapped["Club"] = relationship(back_populates="members")
    attendance_records: Mapped[list["Attendance"]] = relationship(
        back_populates="member",
        cascade="all, delete-orphan",
    )


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    club_id: Mapped[int] = mapped_column(
        ForeignKey("clubs.id"),
        nullable=False,
    )

    club: Mapped["Club"] = relationship(back_populates="events")
    attendance_records: Mapped[list["Attendance"]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
    )


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(primary_key=True)

    member_id: Mapped[int] = mapped_column(
        ForeignKey("members.id"),
        nullable=False,
    )

    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id"),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="present",
    )

    member: Mapped["Member"] = relationship(
        back_populates="attendance_records"
    )
    event: Mapped["Event"] = relationship(
        back_populates="attendance_records"
    )