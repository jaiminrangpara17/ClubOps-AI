import { useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  UserCheck,
  UserPlus,
  Users,
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
  Progress,
  StatCard,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  shift: string;
  checkedIn: boolean;
  status: "confirmed" | "standby";
}

const INITIAL_VOLUNTEERS: Volunteer[] = [
  {
    id: "VOL-01",
    name: "Alex Rivera",
    email: "alex.r@campus.edu",
    phone: "+1 (555) 234-5678",
    area: "Registration",
    shift: "Day 1 · Morning (07:30 - 12:00)",
    checkedIn: false,
    status: "confirmed",
  },
  {
    id: "VOL-02",
    name: "Samantha Wu",
    email: "s.wu@campus.edu",
    phone: "+1 (555) 345-6789",
    area: "Stage crew",
    shift: "Day 1 · Full Day (08:00 - 18:00)",
    checkedIn: true,
    status: "confirmed",
  },
  {
    id: "VOL-03",
    name: "Devon Clark",
    email: "d.clark@campus.edu",
    phone: "+1 (555) 456-7890",
    area: "Expo floor",
    shift: "Day 1 · Afternoon (12:00 - 17:30)",
    checkedIn: false,
    status: "confirmed",
  },
  {
    id: "VOL-04",
    name: "Elena Rostova",
    email: "elena.r@campus.edu",
    phone: "+1 (555) 567-8901",
    area: "Registration",
    shift: "Day 1 · Morning (07:30 - 12:00)",
    checkedIn: false,
    status: "confirmed",
  },
  {
    id: "VOL-05",
    name: "Liam O'Connor",
    email: "liam.oc@campus.edu",
    phone: "+1 (555) 678-9012",
    area: "Hospitality",
    shift: "Day 1 · Evening (16:00 - 21:00)",
    checkedIn: false,
    status: "standby",
  },
  {
    id: "VOL-06",
    name: "Pooja Patel",
    email: "pooja.p@campus.edu",
    phone: "+1 (555) 789-0123",
    area: "Stage crew",
    shift: "Day 2 · Morning (08:00 - 13:00)",
    checkedIn: false,
    status: "confirmed",
  },
];

const SHIFT_AREAS = [
  { name: "Registration", target: 40, current: 32, tone: "warning" as const },
  { name: "Stage crew", target: 30, current: 27, tone: "info" as const },
  { name: "Expo floor", target: 40, current: 35, tone: "success" as const },
  { name: "Hospitality", target: 30, current: 18, tone: "danger" as const },
];

export default function EventVolunteersPage() {
  const event = useCurrentEvent();
  const [volunteers, setVolunteers] = useState<Volunteer[]>(INITIAL_VOLUNTEERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New volunteer form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newArea, setNewArea] = useState("Registration");
  const [newShift, setNewShift] = useState("Day 1 · Morning (07:30 - 12:00)");

  const handleToggleCheckIn = (id: string) => {
    setVolunteers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, checkedIn: !v.checkedIn } : v))
    );
  };

  const handleAddVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newVol: Volunteer = {
      id: `VOL-${String(volunteers.length + 1).padStart(2, "0")}`,
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, ".")}@campus.edu`,
      phone: newPhone.trim() || "+1 (555) 000-1122",
      area: newArea,
      shift: newShift,
      checkedIn: false,
      status: "confirmed",
    };

    setVolunteers([newVol, ...volunteers]);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setIsModalOpen(false);
  };

  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = selectedArea === "all" || v.area === selectedArea;
    return matchesSearch && matchesArea;
  });

  const totalRegistered = 112 + (volunteers.length - INITIAL_VOLUNTEERS.length);
  const totalSlots = 140;
  const unfilledSlots = totalSlots - totalRegistered;
  const checkedInCount = volunteers.filter((v) => v.checkedIn).length;

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Volunteers"
        description={`Coordinate volunteer rosters, shifts, and day-of check-ins for ${event.name}.`}
        actions={
          <Button leadingIcon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Add volunteer
          </Button>
        }
      />

      {/* Roster Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Confirmed crew"
          value={totalRegistered.toString()}
          hint={`80% of ${totalSlots} roster target`}
          icon={Users}
          tone="brand"
        />
        <StatCard
          label="Active roster slots"
          value={totalSlots.toString()}
          hint="Across 4 operational zones"
          icon={CalendarRange}
          tone="info"
        />
        <StatCard
          label="Unfilled slots"
          value={unfilledSlots.toString()}
          hint="Priority gap: Registration & Hospitality"
          icon={CalendarRange}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Volunteer Directory Table */}
        <div className="space-y-4 lg:col-span-2">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search width={16} height={16} className="text-fg-subtle shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search volunteers by name, email, or ID..."
                className="w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-fg-subtle hover:text-fg p-1"
                >
                  <X width={14} height={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-fg-subtle flex items-center gap-1 shrink-0 mr-1">
                <Filter width={12} height={12} /> Zone:
              </span>
              <button
                onClick={() => setSelectedArea("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                  selectedArea === "all"
                    ? "bg-brand text-white shadow-xs"
                    : "bg-surface-subtle text-fg-muted hover:bg-surface-inset"
                }`}
              >
                All
              </button>
              {SHIFT_AREAS.map((a) => (
                <button
                  key={a.name}
                  onClick={() => setSelectedArea(a.name)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                    selectedArea === a.name
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface-subtle text-fg-muted hover:bg-surface-inset"
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Volunteer Roster Cards */}
          <div className="space-y-3">
            {filteredVolunteers.map((vol) => (
              <Card key={vol.id} className="transition-all hover:border-line-strong">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-fg-subtle">
                        {vol.id}
                      </span>
                      <h4 className="text-sm font-bold text-fg">{vol.name}</h4>
                      <Badge tone="brand" size="sm">
                        {vol.area}
                      </Badge>
                      {vol.checkedIn ? (
                        <Badge tone="success" size="sm">
                          Checked In
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm">
                          Pending Check-in
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                      <span className="flex items-center gap-1">
                        <Clock width={12} height={12} className="text-fg-subtle" />
                        {vol.shift}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail width={12} height={12} className="text-fg-subtle" />
                        {vol.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone width={12} height={12} className="text-fg-subtle" />
                        {vol.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleCheckIn(vol.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        vol.checkedIn
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-surface-subtle text-fg border border-line hover:border-brand hover:text-brand"
                      }`}
                    >
                      {vol.checkedIn ? (
                        <>
                          <CheckCircle2 width={14} height={14} className="text-emerald-600" />
                          <span>Checked In</span>
                        </>
                      ) : (
                        <>
                          <UserCheck width={14} height={14} className="text-fg-subtle" />
                          <span>Check In</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredVolunteers.length === 0 && (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center text-xs text-fg-subtle">
                No volunteers found matching your query.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Shift Coverage Heatmap */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Zone Coverage Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SHIFT_AREAS.map((area) => {
                const percent = Math.round((area.current / area.target) * 100);
                return (
                  <div key={area.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-fg">{area.name}</span>
                      <span className="text-fg-muted font-mono">
                        {area.current} / {area.target} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} size="sm" tone={area.tone} />
                  </div>
                );
              })}

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1 mt-4">
                <p className="font-bold">Urgent Staffing Alert:</p>
                <p>Registration desk requires 8 more volunteers for the morning peak rush (07:30 - 11:30).</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Volunteer Lead Directory</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2.5 text-fg-muted">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div>
                  <p className="font-bold text-fg">Priya N.</p>
                  <p className="text-[11px] text-fg-subtle">Registration Coordinator</p>
                </div>
                <Badge tone="brand">Radio Ch 1</Badge>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div>
                  <p className="font-bold text-fg">Marcus L.</p>
                  <p className="text-[11px] text-fg-subtle">AV & Stage Crew Lead</p>
                </div>
                <Badge tone="brand">Radio Ch 2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-fg">Rina K.</p>
                  <p className="text-[11px] text-fg-subtle">Volunteer Hospitality</p>
                </div>
                <Badge tone="brand">Radio Ch 3</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Volunteer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-fg">Register Volunteer</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-surface-subtle"
              >
                <X width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleAddVolunteer} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-fg mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jordan@campus.edu"
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Operational Area</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="Registration">Registration</option>
                    <option value="Stage crew">Stage crew</option>
                    <option value="Expo floor">Expo floor</option>
                    <option value="Hospitality">Hospitality</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Shift Slot</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="Day 1 · Morning (07:30 - 12:00)">Morning (07:30 - 12:00)</option>
                    <option value="Day 1 · Afternoon (12:00 - 17:30)">Afternoon (12:00 - 17:30)</option>
                    <option value="Day 1 · Full Day (08:00 - 18:00)">Full Day (08:00 - 18:00)</option>
                    <option value="Day 1 · Evening (16:00 - 21:00)">Evening (16:00 - 21:00)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-6">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Volunteer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
