import { useState } from "react";
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileClock,
  FileText,
  MapPin,
  Plus,
  SquareCheckBig,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";

interface Meeting {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  type: "in-person" | "virtual" | "hybrid";
  attendeesCount: number;
  agenda: string[];
  status: "upcoming" | "completed";
  actionItems?: { id: string; text: string; owner: string; done: boolean }[];
}

const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "MTG-01",
    title: "Steering Committee Sync #4: Final Readiness & Safety",
    dateTime: "Tomorrow · 18:00 – 19:30",
    location: "Innovation Hall Room 204 / Zoom",
    type: "hybrid",
    attendeesCount: 12,
    status: "upcoming",
    agenda: [
      "Review venue electrical safety certificate sign-off",
      "Address Day 1 morning volunteer staffing shortage (8 slots)",
      "Catering allergen manifest & dietary plan sign-off",
      "Executive run sheet final approval",
    ],
    actionItems: [
      { id: "a1", text: "Marcus to confirm backup PA microphones", owner: "Marcus L.", done: true },
      { id: "a2", text: "Priya to obtain city permit endorsement", owner: "Priya N.", done: false },
      { id: "a3", text: "Rina to send floater assignment emails", owner: "Rina K.", done: false },
    ],
  },
  {
    id: "MTG-02",
    title: "AV & Stage Crew Technical Walkthrough",
    dateTime: "In 3 days · 14:00 – 16:00",
    location: "Auditorium Main Stage",
    type: "in-person",
    attendeesCount: 8,
    status: "upcoming",
    agenda: [
      "Audio line checks & wireless frequency sweep",
      "Stage lighting cue sequencing with speakers",
      "Livestream broadcast fiber test",
    ],
  },
  {
    id: "MTG-03",
    title: "Volunteer Team Leads Operational Orientation",
    dateTime: "In 5 days · 10:00 – 11:30",
    location: "Student Centre Hub B",
    type: "in-person",
    attendeesCount: 16,
    status: "upcoming",
    agenda: [
      "Distribution of radio channels and earpieces",
      "Incident escalation protocols & first aid station locations",
      "Uniform and badge collection workflow",
    ],
  },
];

export default function EventMeetingsPage() {
  const event = useCurrentEvent();
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New meeting form
  const [newTitle, setNewTitle] = useState("");
  const [newDateTime, setNewDateTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newType, setNewType] = useState<"in-person" | "virtual" | "hybrid">("hybrid");
  const [newAgenda, setNewAgenda] = useState("");

  const handleToggleActionItem = (meetingId: string, actionId: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId && m.actionItems
          ? {
              ...m,
              actionItems: m.actionItems.map((a) =>
                a.id === actionId ? { ...a, done: !a.done } : a
              ),
            }
          : m
      )
    );
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const agendaList = newAgenda
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const newMeeting: Meeting = {
      id: `MTG-${String(meetings.length + 1).padStart(2, "0")}`,
      title: newTitle.trim(),
      dateTime: newDateTime.trim() || "Next Tuesday · 15:00",
      location: newLocation.trim() || "Virtual / Google Meet",
      type: newType,
      attendeesCount: 10,
      status: "upcoming",
      agenda: agendaList.length > 0 ? agendaList : ["General operational review"],
    };

    setMeetings([newMeeting, ...meetings]);
    setNewTitle("");
    setNewDateTime("");
    setNewLocation("");
    setNewAgenda("");
    setIsScheduleModalOpen(false);
  };

  const upcomingCount = meetings.filter((m) => m.status === "upcoming").length;
  const totalActionItems = meetings.flatMap((m) => m.actionItems || []);
  const openActionsCount = totalActionItems.filter((a) => !a.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Meetings"
        description={`Schedule committee syncs, keep agendas aligned, and track decisions for ${event.name}.`}
        actions={
          <Button leadingIcon={CalendarPlus} onClick={() => setIsScheduleModalOpen(true)}>
            Schedule meeting
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Upcoming syncs"
          value={upcomingCount.toString()}
          hint="Next: Steering Committee Tomorrow 18:00"
          icon={Video}
          tone="brand"
        />
        <StatCard
          label="Agenda items"
          value={meetings.reduce((acc, m) => acc + m.agenda.length, 0).toString()}
          hint="Topics scheduled for review"
          icon={FileText}
          tone="info"
        />
        <StatCard
          label="Open action items"
          value={openActionsCount.toString()}
          hint={`${totalActionItems.filter((a) => a.done).length} completed`}
          icon={FileClock}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Meetings List */}
        <div className="space-y-4 lg:col-span-2">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="transition-all hover:border-line-strong">
              <div className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-fg-subtle">
                        {meeting.id}
                      </span>
                      <Badge tone={meeting.type === "virtual" ? "info" : "brand"} size="sm">
                        {meeting.type}
                      </Badge>
                      <Badge tone="success" size="sm">
                        Upcoming
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-fg">{meeting.title}</h3>
                  </div>

                  <span className="text-xs font-semibold text-brand flex items-center gap-1.5 shrink-0">
                    <Clock width={14} height={14} />
                    {meeting.dateTime}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-fg-muted border-y border-line/60 py-2.5">
                  <span className="flex items-center gap-1.5">
                    <MapPin width={13} height={13} className="text-fg-subtle" />
                    {meeting.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users width={13} height={13} className="text-fg-subtle" />
                    {meeting.attendeesCount} Confirmed Attendees
                  </span>
                </div>

                {/* Agenda Items */}
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-fg-muted uppercase tracking-wider text-[11px]">
                    Agenda Topics:
                  </p>
                  <ul className="space-y-1.5">
                    {meeting.agenda.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-fg">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Follow-up Action Items */}
                {meeting.actionItems && meeting.actionItems.length > 0 && (
                  <div className="mt-3 rounded-xl border border-line/70 bg-surface-subtle p-3.5 space-y-2.5 text-xs">
                    <p className="font-bold text-fg flex items-center gap-1.5">
                      <SquareCheckBig width={14} height={14} className="text-indigo-500" />
                      Assigned Action Items:
                    </p>
                    <div className="space-y-1.5">
                      {meeting.actionItems.map((act) => (
                        <div
                          key={act.id}
                          onClick={() => handleToggleActionItem(meeting.id, act.id)}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface border border-line/60 cursor-pointer hover:border-brand/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={act.done}
                              onChange={() => {}}
                              className="rounded text-brand focus:ring-brand"
                            />
                            <span
                              className={`text-xs ${
                                act.done ? "line-through text-fg-subtle" : "text-fg font-medium"
                              }`}
                            >
                              {act.text}
                            </span>
                          </div>
                          <Badge tone={act.done ? "success" : "neutral"} size="sm">
                            {act.owner}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Meeting Cadence</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3 text-fg-muted">
              <div className="p-3 rounded-xl bg-surface-subtle border border-line space-y-1">
                <p className="font-bold text-fg">Steering Committee Sync</p>
                <p>Every Tuesday & Thursday at 18:00 until Day 1.</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-line space-y-1">
                <p className="font-bold text-fg">Daily Morning Standup</p>
                <p>Begins 3 days prior to kickoff at 09:00.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Video Conference Hub</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2.5 text-fg-muted">
              <p>Default Google Meet room for this event:</p>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-brand/20 bg-brand-soft/40 font-mono text-brand font-semibold">
                <span>meet.google.com/tf26-sync</span>
                <ExternalLink width={13} height={13} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-fg">Schedule Committee Meeting</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-surface-subtle"
              >
                <X width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-fg mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Day-1 Logistics and Sponsor Run-through"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Date & Time</label>
                  <input
                    type="text"
                    required
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    placeholder="e.g. Friday · 16:00"
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="in-person">In Person</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-fg mb-1">Location / Room Link</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Innovation Hall Room 102 or Zoom link"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-fg mb-1">Agenda Topics (one per line)</label>
                <textarea
                  rows={3}
                  value={newAgenda}
                  onChange={(e) => setNewAgenda(e.target.value)}
                  placeholder="Review caterer delivery schedule&#10;Confirm volunteer badges&#10;Stage sound check plan"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-6">
                <Button variant="outline" type="button" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Meeting</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
