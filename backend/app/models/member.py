from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    club_id: Mapped[int] = mapped_column(
        ForeignKey("clubs.id"),
        nullable=False,
    )

    club = relationship("Club", back_populates="members")
    attendance_records = relationship(
        "Attendance",
        back_populates="member",
        cascade="all, delete-orphan",
    )
