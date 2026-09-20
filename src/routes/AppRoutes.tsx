import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout, EventLayout } from "@/components/layout";
import DashboardPage from "@/pages/DashboardPage";
import EventsPage from "@/pages/EventsPage";
import FoundationPage from "@/pages/FoundationPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";
import EventAnnouncementsPage from "@/pages/event/EventAnnouncementsPage";
import AnnouncementCreatePage from "@/pages/event/AnnouncementCreatePage";
import AnnouncementDetailPage from "@/pages/event/AnnouncementDetailPage";
import AnnouncementEditPage from "@/pages/event/AnnouncementEditPage";
import EventCopilotPage from "@/pages/event/EventCopilotPage";
import AiActionReviewPage from "@/pages/event/AiActionReviewPage";
import AiActionsPage from "@/pages/event/AiActionsPage";
import DocumentDetailPage from "@/pages/event/DocumentDetailPage";
import EventDocumentsPage from "@/pages/event/EventDocumentsPage";
import EventMeetingsPage from "@/pages/event/EventMeetingsPage";
import MeetingCreatePage from "@/pages/event/MeetingCreatePage";
import MeetingDetailPage from "@/pages/event/MeetingDetailPage";
import MeetingEditPage from "@/pages/event/MeetingEditPage";
import EventOverviewPage from "@/pages/event/EventOverviewPage";
import EventRisksPage from "@/pages/event/EventRisksPage";
import RiskCreatePage from "@/pages/event/RiskCreatePage";
import RiskDetailPage from "@/pages/event/RiskDetailPage";
import RiskEditPage from "@/pages/event/RiskEditPage";
import EventTasksPage from "@/pages/event/EventTasksPage";
import EventVolunteersPage from "@/pages/event/EventVolunteersPage";
import VolunteerCreatePage from "@/pages/event/VolunteerCreatePage";
import VolunteerDetailPage from "@/pages/event/VolunteerDetailPage";
import VolunteerEditPage from "@/pages/event/VolunteerEditPage";

/**
 * /login is public. Everything inside AppLayout sits behind ProtectedRoute,
 * which preserves the requested location for post-login return.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="events" element={<EventsPage />} />
          <Route path="events/:eventId" element={<EventLayout />}>
            <Route index element={<EventOverviewPage />} />
            <Route path="tasks" element={<EventTasksPage />} />
            <Route path="volunteers" element={<EventVolunteersPage />} />
            <Route path="volunteers/new" element={<VolunteerCreatePage />} />
            <Route path="volunteers/:volunteerId" element={<VolunteerDetailPage />} />
            <Route path="volunteers/:volunteerId/edit" element={<VolunteerEditPage />} />
            <Route path="meetings" element={<EventMeetingsPage />} />
            <Route path="meetings/new" element={<MeetingCreatePage />} />
            <Route path="meetings/:meetingId" element={<MeetingDetailPage />} />
            <Route path="meetings/:meetingId/edit" element={<MeetingEditPage />} />
            <Route path="documents" element={<EventDocumentsPage />} />
            <Route path="documents/:documentId" element={<DocumentDetailPage />} />
            <Route path="risks" element={<EventRisksPage />} />
            <Route path="risks/new" element={<RiskCreatePage />} />
            <Route path="risks/:riskId" element={<RiskDetailPage />} />
            <Route path="risks/:riskId/edit" element={<RiskEditPage />} />
            <Route path="announcements" element={<EventAnnouncementsPage />} />
            <Route path="announcements/new" element={<AnnouncementCreatePage />} />
            <Route path="announcements/:announcementId" element={<AnnouncementDetailPage />} />
            <Route path="announcements/:announcementId/edit" element={<AnnouncementEditPage />} />
            <Route path="ai" element={<EventCopilotPage />} />
            <Route path="ai/actions" element={<AiActionsPage />} />
            <Route path="ai/actions/:actionId" element={<AiActionReviewPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="foundation" element={<FoundationPage />} />

          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
