import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { NAV_ITEMS } from "@/lib/navigation";
import FoundationPage from "@/pages/FoundationPage";
import ModulePlaceholderPage from "@/pages/ModulePlaceholderPage";
import NotFoundPage from "@/pages/NotFoundPage";

/** Short descriptions used by placeholder module routes. */
const MODULE_DESCRIPTIONS: Record<string, string> = {
  dashboard: "Operational overview of events, readiness and outstanding work.",
  events: "Plan, schedule and track every club event from draft to debrief.",
  tasks: "Assign, prioritise and monitor operational tasks across teams.",
  volunteers: "Manage volunteer rosters, availability and shift coverage.",
  meetings: "Agendas, minutes and follow-up actions for committee meetings.",
  documents: "Central library for policies, permits and event paperwork.",
  risks: "Log, assess and mitigate operational and compliance risks.",
  announcements: "Publish updates to members, volunteers and stakeholders.",
  copilot: "Conversational assistance over your club's operational data.",
};

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/foundation" element={<FoundationPage />} />
        {NAV_ITEMS.map((item) => (
          <Route
            key={item.id}
            path={item.to}
            element={
              <ModulePlaceholderPage
                title={item.label}
                description={MODULE_DESCRIPTIONS[item.id] ?? ""}
                icon={item.icon}
              />
            }
          />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
