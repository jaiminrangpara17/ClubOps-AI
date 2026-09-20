from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class CopilotSource(BaseModel):
    type: str = Field(..., description="Type of source entity (e.g., club, event, member, attendance)")
    id: int | str = Field(..., description="Unique identifier of the entity")
    name: str = Field(..., description="Name or title of the referenced entity")


class CopilotAction(BaseModel):
    label: str = Field(..., description="Human-readable button or action label")
    action_type: str = Field(..., description="Action classification, e.g. navigate, view, filter")
    target: str = Field(..., description="Navigation route or target reference")


class CopilotRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Natural language query or question about ClubOps")
    club_id: int | None = Field(None, description="Optional club context identifier")


class CopilotResponse(BaseModel):
    answer: str = Field(..., description="AI generated answer grounded in verified backend data")
    sources: list[CopilotSource] = Field(default_factory=list, description="Referenced database entities")
    actions: list[CopilotAction] = Field(default_factory=list, description="Suggested UI actions or navigation links")


class ScheduleItem(BaseModel):
    time: str = Field(..., description="Time slot, duration, or milestone")
    activity: str = Field(..., description="Activity description")


class EventPlanRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Event planning instruction or goal")
    club_id: int | None = Field(None, description="Club ID for which the event is being planned")


class EventPlanResponse(BaseModel):
    title: str = Field(..., description="Generated event title")
    description: str = Field(..., description="Detailed event description")
    suggested_schedule: list[ScheduleItem] = Field(default_factory=list, description="Suggested timeline or agenda")
    audience: str = Field(..., description="Target audience and expected participant scale")
    tasks: list[str] = Field(default_factory=list, description="Preparation and execution tasks")
    resources: list[str] = Field(default_factory=list, description="Required equipment, venue, or materials")
    risks: list[str] = Field(default_factory=list, description="Identified operational risks")
    follow_up_actions: list[str] = Field(default_factory=list, description="Post-event follow-up items")


class ActionValidationRequest(BaseModel):
    action_type: str = Field(..., description="Type of action being evaluated, e.g. create_event, delete_member")
    parameters: dict[str, Any] = Field(default_factory=dict, description="Action parameters and payload")
    club_id: int | None = Field(None, description="Club ID context")


class ActionValidationResponse(BaseModel):
    valid: bool = Field(..., description="Whether the proposed action satisfies business rules and operational constraints")
    reason: str = Field(..., description="Explanation of validation status")
    risk: str | None = Field(None, description="Potential operational or policy risks identified")
    suggested_correction: str | None = Field(None, description="Suggested adjustment if the action is invalid or risky")


class ActionItem(BaseModel):
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task detail")
    owner: str | None = Field(None, description="Assigned member or team lead")
    due_date: str | None = Field(None, description="Target completion deadline")
    priority: str = Field("medium", description="Priority level: low, medium, high, critical")
    source: str = Field("meeting transcript", description="Origin of this action item")


class MeetingAnalyzeRequest(BaseModel):
    transcript: str = Field(..., min_length=1, description="Raw meeting transcript or notes")
    club_id: int | None = Field(None, description="Club context identifier")


class MeetingIntelligenceResponse(BaseModel):
    summary: str = Field(..., description="Executive summary of the meeting")
    decisions: list[str] = Field(default_factory=list, description="Agreed decisions and motions")
    action_items: list[ActionItem] = Field(default_factory=list, description="Extracted actionable tasks with owners and deadlines")
    risks: list[str] = Field(default_factory=list, description="Identified concerns or blockers discussed")
    follow_up: list[str] = Field(default_factory=list, description="Required next steps and upcoming checkpoints")


class AIInsightMetric(BaseModel):
    metric_name: str = Field(..., description="Name of the computed operational metric")
    value: Any = Field(..., description="Factual numerical or categorical value")
    interpretation: str = Field(..., description="AI interpretation of this metric")


class AIInsightResponse(BaseModel):
    club_id: int | None = Field(None, description="Target club ID")
    metrics: list[AIInsightMetric] = Field(default_factory=list, description="Factual metrics computed from database")
    insights: list[str] = Field(default_factory=list, description="AI-generated operational observations")
    recommendations: list[str] = Field(default_factory=list, description="Actionable recommendations for club leaders")

    model_config = ConfigDict(from_attributes=True)
