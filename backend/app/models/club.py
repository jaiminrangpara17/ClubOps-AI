from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Club(Base):
    __tablename__ = "clubs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    members = relationship(
        "Member",
        back_populates="club",
        cascade="all, delete-orphan",
    )

    events = relationship(
        "Event",
        back_populates="club",
        cascade="all, delete-orphan",
    )
