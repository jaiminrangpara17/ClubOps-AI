import { CalendarPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, EmptyState } from "@/components/ui";

/**
 * Rendered when the workspace has no active event.
 * Links to the events list — event creation is a later milestone, so the
 * destination stays within the agreed routes.
 */
export function EmptyDashboard() {
  return (
    <EmptyState
      variant="page"
      icon={CalendarPlus}
      title="No active event yet"
      description="Create your first event to start managing tasks, volunteers, meetings and risks."
      actions={
        <Link to="/events">
          <Button leadingIcon={CalendarPlus}>Create event</Button>
        </Link>
      }
    />
  );
}
