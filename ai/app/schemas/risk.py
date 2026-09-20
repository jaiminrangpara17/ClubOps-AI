from pydantic import BaseModel, ConfigDict, Field

from .common import RiskSeverity


class Risk(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1)
    description: str | None = Field(default=None, description="AI explanation - not factual claim")
    severity: RiskSeverity
    reason: str | None = Field(default=None, description="Factual signal / evidence")
    affected_tasks: list[str] = Field(default_factory=list)
    recommended_action: str | None = None
    is_ai_prediction: bool = Field(default=True, description="Marks AI inference vs verified fact")
