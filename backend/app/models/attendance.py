from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


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

    present: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    member = relationship("Member", back_populates="attendance_records")
    event = relationship("Event", back_populates="attendance_records")
