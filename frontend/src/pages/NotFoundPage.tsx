import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, EmptyState } from "@/components/ui";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      variant="page"
      icon={Compass}
      title="Page not found"
      description="The route you requested does not exist in ClubOps AI."
      actions={<Button onClick={() => navigate("/")}>Back to dashboard</Button>}
    />
  );
}
