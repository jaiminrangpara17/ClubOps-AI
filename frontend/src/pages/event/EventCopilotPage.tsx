import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  SquareCheckBig,
  FileText,
  Users,
  Calendar,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  Progress,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";
import { DEMO_STATS, DEMO_DEADLINES, DEMO_RISKS, DEMO_PRIORITIES } from "@/data/demoDashboard";
import { daysUntil, formatDate } from "@/lib/format";

interface Citation {
  label: string;
  type: "task" | "risk" | "document" | "volunteer";
  id: string;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  citations?: Citation[];
  suggestedFollowups?: string[];
}

const QUICK_PROMPTS = [
  "What is blocking day-1 readiness?",
  "Summarise open risks by severity",
  "Which volunteer shifts are still unfilled?",
  "Draft an update for the committee",
];

export default function EventCopilotPage() {
  const event = useCurrentEvent();
  const daysLeft = daysUntil(event.startIso);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: Message = {
    id: "m-0",
    role: "assistant",
    content: `Hello! I'm your **ClubOps AI Copilot**, grounded in the live operational data for **${event.name}** (${event.code}).\n\nI have indexed **${DEMO_STATS[0]?.value || 34} tasks**, **${DEMO_STATS[2]?.value || 6} pending documents**, and **${DEMO_RISKS.length} active risk items**. How can I help you coordinate operations today?`,
    timestamp: "Just now",
    suggestedFollowups: QUICK_PROMPTS,
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        ...initialGreeting,
        id: `m-${Date.now()}`,
      },
    ]);
  };

  const generateAIResponse = (query: string): { content: string; citations: Citation[]; followups: string[] } => {
    const q = query.toLowerCase();

    if (q.includes("blocking") || q.includes("readiness") || q.includes("day-1")) {
      return {
        content: `### 🎯 Day-1 Readiness Diagnostic for **${event.name}**\n\nOverall readiness is currently **${event.readiness}%** with **${daysLeft > 0 ? `${daysLeft} days` : "imminent kickoff"}** remaining. Here are the top 2 blockers identified across modules:\n\n1. **High Priority: Venue Safety Certification**\n   - Document *Venue safety certificate* is pending signature by Priya N. (due tomorrow).\n   - **Impact:** Prevents stage build access and delays final insurance clearance.\n   - **Recommended Action:** Escalate to venue liaison immediately.\n\n2. **Volunteer Staffing Deficit**\n   - Registration desk is short **8 volunteers** for the morning peak slot.\n   - **Mitigation in progress:** Float 4 members from the expo rotation.\n\n**Confidence:** Grounded across 34 tasks and 4 regulatory permits.`,
        citations: [
          { label: "Doc: Venue Safety Permit", type: "document", id: "d1" },
          { label: "Risk: Registration Understaffed", type: "risk", id: "r1" },
          { label: "Priority: Catering Contract", type: "task", id: "p1" },
        ],
        followups: [
          "Draft an escalation email for the safety permit",
          "Show available floaters for registration",
          "Calculate readiness projection",
        ],
      };
    }

    if (q.includes("risk") || q.includes("severity") || q.includes("mitigate")) {
      return {
        content: `### 🛡️ Risk Summary by Severity for **${event.name}**\n\nThere are **${DEMO_RISKS.length} active risks** currently being tracked in the risk register:\n\n- 🔴 **HIGH SEVERITY**: *Registration desk understaffed on day 1*\n  - **Area:** Volunteers\n  - **Mitigation:** Reassign 4 floaters from the expo team (Owner: Priya N.)\n\n- 🟡 **MEDIUM SEVERITY**: *Outdoor stage weather exposure*\n  - **Area:** Operations\n  - **Mitigation:** Holding secondary covered hall as contingency until day -3.\n\n- 🟢 **LOW SEVERITY**: *Sponsor branding delivery late*\n  - **Area:** Partnerships\n  - **Mitigation:** Print buffer reserved with on-campus local supplier.\n\n**Recommendation:** Prioritize the volunteer floater reallocation at tomorrow's 18:00 committee sync.`,
        citations: [
          { label: "Risk R1: Registration Desk", type: "risk", id: "r1" },
          { label: "Risk R2: Outdoor Weather", type: "risk", id: "r2" },
          { label: "Risk R3: Sponsor Branding", type: "risk", id: "r3" },
        ],
        followups: [
          "What is the weather contingency plan?",
          "Notify floater volunteers of reassignment",
          "Export risk register as PDF",
        ],
      };
    }

    if (q.includes("volunteer") || q.includes("shift") || q.includes("unfilled") || q.includes("roster")) {
      return {
        content: `### 👥 Volunteer Shift & Roster Analysis\n\n- **Total Slots:** 140 slots\n- **Confirmed Crew:** 112 volunteers (80% coverage, +18 this week)\n- **Open Slots:** **28 remaining slots**\n\n#### Critical Unfilled Slots:\n1. **Morning Registration Desk (08:00 – 11:30):** 8 volunteers needed *(High Impact)*\n2. **Keynote Room AV Assistance (10:00 – 14:00):** 3 volunteers needed\n3. **Catering Hall Floaters (12:00 – 15:00):** 5 volunteers needed\n\n**Actionable Suggestion:** Broadcast an urgent call-out to the 32 student ambassadors who indicated secondary availability.`,
        citations: [
          { label: "Roster: 112 Confirmed / 140 Total", type: "volunteer", id: "v1" },
          { label: "Task: Close shift sign-ups", type: "task", id: "d3" },
        ],
        followups: [
          "Draft announcement to student ambassadors",
          "Assign Marcus L. as morning shift lead",
          "View full volunteer directory",
        ],
      };
    }

    if (q.includes("update") || q.includes("committee") || q.includes("draft") || q.includes("memo")) {
      return {
        content: `### 📝 Draft: Committee Operational Update\n\n**To:** ${event.name} Steering Committee  \n**From:** Operations Team & AI Copilot  \n**Date:** ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}  \n**Subject:** Operational Briefing: T-${daysLeft} Days Readiness Report  \n\n---\n\n**1. Executive Summary**\n${event.name} preparation is on track with an overall readiness index of **${event.readiness}%**. With ${daysLeft} days until launch, focus transitions to volunteer shift allocations and document clearance.\n\n**2. Key Milestones & Metrics**\n- **Attendees Expected:** ${event.attendeesExpected.toLocaleString()}\n- **Team Size:** ${event.teamSize} dedicated staff & leads\n- **Volunteer Roster:** 112 / 140 slots filled (80% capacity)\n\n**3. Immediate Action Items**\n- Expedite the **Venue Safety Certificate** (due tomorrow, Priya N.).\n- Reallocate 4 expo floaters to address the morning check-in queue.\n- Review final AV tech rider with Marcus L.\n\n*Prepared by ClubOps-AI.*`,
        citations: [
          { label: "Dashboard Stats #TF26", type: "task", id: "s1" },
          { label: "Committee Agenda Doc", type: "document", id: "d4" },
        ],
        followups: [
          "Copy memo to clipboard",
          "Add safety cert follow-up to my tasks",
          "Send via announcements channel",
        ],
      };
    }

    return {
      content: `I analyzed the records for **${event.name}** regarding *"**${query}**"*:\n\n- **Event Scope:** ${event.summary}\n- **Venue:** ${event.venue}\n- **Operational Timeline:** ${formatDate(event.startIso)} to ${formatDate(event.endIso)}\n- **Current Progress:** ${event.readiness}% readiness across active tasks.\n\nAll operational modules (Tasks, Risks, Documents, and Volunteers) are synchronized with this query. Would you like me to draft an announcement or generate a focused checklist for this?`,
      citations: [
        { label: `Event Record: ${event.code}`, type: "task", id: "ev1" },
        { label: "Master Operations Schedule", type: "document", id: "sch" },
      ],
      followups: [
        "What is blocking day-1 readiness?",
        "Summarise open risks by severity",
        "Draft an update for the committee",
      ],
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(text);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response.content,
        timestamp: "Just now",
        citations: response.citations,
        suggestedFollowups: response.followups,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="AI Copilot"
        description={`Ask questions, analyze readiness, and draft operational work for ${event.name}.`}
        meta={
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <Badge tone="success">Active · Live Event Grounding</Badge>
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            leadingIcon={RotateCcw}
            onClick={handleClear}
            title="Reset conversation"
          >
            Reset Chat
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Conversation Canvas */}
        <Card className="flex h-[680px] flex-col overflow-hidden border-line lg:col-span-2">
          <CardHeader className="border-b border-line bg-surface-subtle/50 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                  <Bot width={16} height={16} aria-hidden />
                </span>
                <span>Copilot Conversation</span>
              </CardTitle>
              <span className="text-xs text-fg-subtle">
                Model: <strong className="font-medium text-fg-muted">ClubOps-Reasoner v2</strong>
              </span>
            </div>
          </CardHeader>

          {/* Chat Messages Log */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm ${isAssistant ? "items-start" : "items-start justify-end"}`}
                >
                  {isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                      <Sparkles width={15} height={15} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                      isAssistant
                        ? "border border-line bg-surface text-fg"
                        : "bg-brand text-white"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert space-y-2 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Citations / Evidence Grounding */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3.5 border-t border-line/60 pt-2.5">
                        <p className="text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
                          Grounded Sources:
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-md border border-line-strong/60 bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted"
                            >
                              {cite.type === "document" && <FileText width={11} height={11} className="text-amber-500" />}
                              {cite.type === "risk" && <ShieldAlert width={11} height={11} className="text-rose-500" />}
                              {cite.type === "task" && <SquareCheckBig width={11} height={11} className="text-indigo-500" />}
                              {cite.type === "volunteer" && <Users width={11} height={11} className="text-emerald-500" />}
                              {cite.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Followups inside message */}
                    {msg.suggestedFollowups && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedFollowups.map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(prompt)}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand/30 bg-brand-soft/60 px-2.5 py-1 text-xs text-brand transition-colors hover:border-brand hover:bg-brand-soft"
                          >
                            <Lightbulb width={11} height={11} />
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Message Actions */}
                    {isAssistant && (
                      <div className="mt-2.5 flex items-center justify-between pt-1 text-[11px] text-fg-subtle">
                        <span>{msg.timestamp}</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-surface-inset hover:text-fg transition-colors"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check width={12} height={12} className="text-emerald-500" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy width={12} height={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-inset text-fg-muted border border-line">
                      <User width={15} height={15} />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                  <Sparkles width={15} height={15} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-fg-muted shadow-xs">
                  <span className="text-xs font-medium text-brand">Synthesizing event data</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]"></span>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Section */}
          <div className="border-t border-line bg-surface p-3 md:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 rounded-xl border border-line-strong/60 bg-surface-subtle px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Ask Copilot anything about ${event.name} (readiness, tasks, shifts)...`}
                aria-label="Message the copilot"
                className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                leadingIcon={Send}
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
              >
                Send
              </Button>
            </form>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-fg-subtle">
              <span>Grounded in live event tasks, risks, documents and roster.</span>
              <span className="hidden sm:inline">Press Enter ↵ to send</span>
            </div>
          </div>
        </Card>

        {/* Right Sidebar: Context Grounding & Quick Actions */}
        <div className="space-y-4">
          {/* Active Event Health Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar width={15} height={15} className="text-brand" />
                Active Event Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-fg-muted">Readiness Score</span>
                  <span className="text-fg font-semibold">{event.readiness}%</span>
                </div>
                <Progress value={event.readiness} className="mt-1.5 h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-line/60">
                <div className="rounded-lg bg-surface-subtle p-2">
                  <span className="text-[11px] text-fg-subtle block">Kickoff in</span>
                  <span className="text-sm font-bold text-fg">
                    {daysLeft > 0 ? `${daysLeft} Days` : "Live Now"}
                  </span>
                </div>
                <div className="rounded-lg bg-surface-subtle p-2">
                  <span className="text-[11px] text-fg-subtle block">Expected</span>
                  <span className="text-sm font-bold text-fg">
                    {event.attendeesExpected.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indexed Knowledge Index */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles width={15} height={15} className="text-amber-500" />
                Grounding Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-line/60 bg-surface-subtle/50 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-fg-muted font-medium">
                  <SquareCheckBig width={14} height={14} className="text-indigo-500" />
                  Operational Tasks
                </span>
                <Badge tone="brand">34 Indexed</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-line/60 bg-surface-subtle/50 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-fg-muted font-medium">
                  <ShieldAlert width={14} height={14} className="text-rose-500" />
                  Risk Register
                </span>
                <Badge tone="danger">3 Logged</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-line/60 bg-surface-subtle/50 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-fg-muted font-medium">
                  <Users width={14} height={14} className="text-emerald-500" />
                  Volunteer Roster
                </span>
                <Badge tone="success">112 Confirmed</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-line/60 bg-surface-subtle/50 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-fg-muted font-medium">
                  <FileText width={14} height={14} className="text-amber-500" />
                  Compliance Documents
                </span>
                <Badge tone="warning">6 Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Trigger Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">1-Click AI Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  className="group flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-left text-xs font-medium text-fg-muted hover:border-brand hover:bg-brand-soft/40 hover:text-brand transition-all"
                >
                  <span className="line-clamp-1">{prompt}</span>
                  <ChevronRight
                    width={14}
                    height={14}
                    className="shrink-0 text-fg-subtle group-hover:translate-x-0.5 group-hover:text-brand transition-transform"
                  />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
