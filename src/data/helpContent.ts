import type { HelpArticle, HelpFaq, TroubleshootingItem } from "@/types";

/** Product help content. Static by design; there is no documentation API. */
export const HELP_CATEGORIES = [
  "Getting Started",
  "Events",
  "Tasks",
  "Volunteers",
  "Meetings",
  "Documents",
  "Risks",
  "Announcements",
  "AI Copilot",
  "AI Actions",
  "Account & Access",
  "Troubleshooting",
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "start-dashboard",
    title: "How do I get started with ClubOps AI?",
    category: "Getting Started",
    summary: "Start from the Command Center, choose the event you are operating, and follow the workspace tabs.",
    keywords: ["dashboard", "event", "workspace", "start"],
    steps: [
      "Sign in with your ClubOps account.",
      "Review the Command Center for the active event and current operational priorities.",
      "Use the event switcher in the top bar to move between events.",
      "Open the event workspace to reach Tasks, Volunteers, Meetings, Documents, Risks, Announcements, and AI Copilot.",
    ],
  },
  {
    id: "events-context",
    title: "How does event context work?",
    category: "Events",
    summary: "Every operational module is scoped to the event selected in the workspace.",
    keywords: ["event", "switch", "context", "scope"],
    steps: [
      "Use the current event switcher in the top bar to select an event.",
      "The selected event is reflected in the sidebar, breadcrumbs, event tabs, and page headers.",
      "When a module is event-scoped, its records are loaded using that event's identifier.",
      "If an event is missing or unavailable, ClubOps AI shows an event-not-found state rather than mixing records.",
    ],
  },
  {
    id: "tasks-overview",
    title: "How do I track operational tasks?",
    category: "Tasks",
    summary: "Use the event Tasks workspace to review ownership, priority, deadlines, blockers, and status.",
    keywords: ["task", "deadline", "owner", "blocked", "overdue"],
    steps: [
      "Open an event and choose Tasks from the event navigation.",
      "Scan the task list for the owner, priority, status, due date, and blocker information.",
      "Use search and filters to narrow the operational view.",
      "Open a task or use its available actions to review the current record. Backend permissions determine which changes are allowed.",
    ],
  },
  {
    id: "volunteer-workforce",
    title: "How do I manage event volunteers?",
    category: "Volunteers",
    summary: "Volunteers are event-specific participation records connected to existing club members.",
    keywords: ["volunteer", "member", "availability", "workload", "role"],
    steps: [
      "Open Volunteers from the event workspace.",
      "Search or filter by event role, availability, status, or workload.",
      "Add an existing club member to the event rather than creating a duplicate identity.",
      "Open a volunteer profile to review event participation and tasks assigned to that member.",
    ],
  },
  {
    id: "meeting-intelligence",
    title: "How does Meeting Intelligence work?",
    category: "Meetings",
    summary: "Meeting records can include metadata, transcript text, decisions, and action items when processing is available.",
    keywords: ["meeting", "transcript", "decision", "action item", "processing"],
    steps: [
      "Create or open a meeting inside an event.",
      "Review its participants, agenda, notes, and transcript when available.",
      "If the backend supports processing, the meeting reports whether intelligence is queued, processing, ready, or failed.",
      "Extracted action items can be turned into tasks only through an explicit user action when the backend supports it.",
    ],
  },
  {
    id: "documents-content",
    title: "How do documents and extracted content work?",
    category: "Documents",
    summary: "Documents remain event-scoped and show their processing state before content or intelligence is available.",
    keywords: ["document", "upload", "processing", "content", "search"],
    steps: [
      "Open Documents inside an event to see metadata and processing state.",
      "Upload is offered only when the backend capability response allows it.",
      "Queued and processing documents do not show extracted content until the backend confirms readiness.",
      "Content search and structured intelligence are available only when the backend advertises those capabilities.",
    ],
  },
  {
    id: "risk-register",
    title: "Where can I review event risks?",
    category: "Risks",
    summary: "Risk Management shows severity, assessment, owner, source, mitigation, and explicit links to operational records.",
    keywords: ["risk", "severity", "mitigation", "owner", "source"],
    steps: [
      "Open Risks from an event workspace.",
      "Use severity, status, source, owner, and assessment filters when supported.",
      "Open a risk to review its mitigation plan and linked tasks, meetings, documents, or volunteers.",
      "Risk scores and valid status transitions come from the backend; the frontend does not calculate them.",
    ],
  },
  {
    id: "announcement-states",
    title: "How do announcements work?",
    category: "Announcements",
    summary: "Announcements can be saved as drafts or published to a configured audience when the backend supports publishing.",
    keywords: ["announcement", "draft", "publish", "audience", "priority"],
    steps: [
      "Open Announcements inside an event.",
      "Create a plain-text update with its priority, category, and configured audience.",
      "Leave Publish immediately unchecked to save a draft.",
      "Publishing is an explicit backend-confirmed transition; ClubOps AI does not send email, SMS, or push messages from the frontend.",
    ],
  },
  {
    id: "copilot-grounding",
    title: "How does AI Copilot work?",
    category: "AI Copilot",
    summary: "Copilot is scoped to the current event and is designed to answer operational questions from available event data.",
    keywords: ["ai", "copilot", "question", "sources", "event"],
    steps: [
      "Open AI Copilot from the current event workspace.",
      "Ask about tasks, deadlines, volunteers, meetings, documents, risks, or announcements.",
      "When the backend supplies sources, use them to verify important details.",
      "AI responses may be incomplete. Copilot suggests and navigates; it does not independently change event data.",
    ],
  },
  {
    id: "ai-action-approval",
    title: "What happens when an AI action needs approval?",
    category: "AI Actions",
    summary: "Consequential AI suggestions require explicit human review and backend confirmation.",
    keywords: ["ai action", "approval", "reject", "review", "execute"],
    steps: [
      "Open Review actions from the event Copilot or the dashboard indicator.",
      "Inspect the rationale, affected record, and authoritative before/after values.",
      "Explicitly approve or reject the suggestion. The frontend never executes an action just because AI suggested it.",
      "The UI shows success only after the backend confirms execution and returns the authoritative result.",
    ],
  },
  {
    id: "account-access",
    title: "Why can I not access an event or action?",
    category: "Account & Access",
    summary: "The backend controls access. The frontend reflects unauthorized and forbidden responses without bypassing them.",
    keywords: ["login", "access", "permission", "unauthorized", "forbidden", "role"],
    steps: [
      "Confirm you are signed in with the correct account.",
      "Check that the event appears in your event switcher.",
      "A 401 response means your session may have expired; sign in again.",
      "A 403 response means the backend has denied the operation. Contact your workspace administrator.",
    ],
  },
];

export const HELP_FAQS: HelpFaq[] = [
  {
    id: "faq-first-event",
    question: "How do I create my first event?",
    answer: "Open Events from the sidebar. Event creation is only available when the connected backend exposes the event creation capability; otherwise the workspace shows the current events without offering a fake create action.",
    category: "Events",
  },
  {
    id: "faq-overdue",
    question: "How do I track overdue tasks?",
    answer: "Open an event's Tasks workspace and use the deadline filters. Completed tasks are not treated as overdue. The dashboard and task views use the task status and due date supplied by the service.",
    category: "Tasks",
  },
  {
    id: "faq-volunteers",
    question: "How do I add volunteers?",
    answer: "Open Volunteers inside an event and choose Add volunteer. The participation form selects an existing club member and adds event-specific role, availability, status, and notes. It does not create a duplicate global user.",
    category: "Volunteers",
  },
  {
    id: "faq-ai-change",
    question: "Can AI automatically change my event data?",
    answer: "No. Copilot suggestions are navigation or review prompts. Consequential AI actions appear in the approval center and require an explicit user approval before the backend can execute them.",
    category: "AI Actions",
  },
  {
    id: "faq-processing",
    question: "Why is a meeting or document still processing?",
    answer: "Processing is asynchronous. The interface shows the state reported by the backend and refreshes the record when it changes. If processing fails, the page shows the failure state rather than displaying made-up extracted results.",
    category: "Troubleshooting",
  },
  {
    id: "faq-theme",
    question: "Where do I change the theme?",
    answer: "Use the sun/moon control in the top bar. Theme preference is stored in this browser by the existing theme provider.",
    category: "Account & Access",
  },
];

export const TROUBLESHOOTING_ITEMS: TroubleshootingItem[] = [
  {
    id: "trouble-event",
    title: "Unable to load my event",
    symptoms: "The event page shows an error, not-found state, or no current event.",
    steps: [
      "Refresh the page once.",
      "Return to Events and open the event again.",
      "Confirm the event is available to your account.",
      "If the error persists, contact your workspace administrator with the event name.",
    ],
  },
  {
    id: "trouble-tasks",
    title: "Tasks are not appearing",
    symptoms: "The task list is empty, filtered, or unable to load.",
    steps: [
      "Clear active filters and confirm you are in the correct event.",
      "Refresh the task list.",
      "Check whether the task belongs to another event.",
      "If the backend is unavailable, wait and retry rather than creating duplicate work.",
    ],
  },
  {
    id: "trouble-document",
    title: "Document processing is still pending",
    symptoms: "A document shows queued or processing instead of ready.",
    steps: [
      "Keep the document page open or revisit it later; the status is refreshed from the service.",
      "Do not assume extracted content is ready while processing is pending.",
      "If it changes to failed, follow the retry action only when the backend advertises one.",
    ],
  },
  {
    id: "trouble-ai",
    title: "AI Copilot is unavailable",
    symptoms: "The Copilot page cannot start a conversation or returns a service error.",
    steps: [
      "Confirm you are signed in and have access to the current event.",
      "Retry once after checking the event context.",
      "If the service is rate limited or offline, continue using the event's operational modules directly.",
    ],
  },
  {
    id: "trouble-save",
    title: "Something went wrong while saving",
    symptoms: "A form stays open and displays a server or network error.",
    steps: [
      "Keep the form open so your values are not lost.",
      "Review required fields and try again once.",
      "If the backend reports forbidden or unauthorized, ask an administrator to check your access.",
    ],
  },
];