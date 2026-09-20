from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    club_id: Mapped[int] = mapped_column(
        ForeignKey("clubs.id"),
        nullable=False,
    )

    club = relationship("Club", back_populates="events")
    attendance_records = relationship(
        "Attendance",
        back_populates="event",
        cascade="all, delete-orphan",
    )
