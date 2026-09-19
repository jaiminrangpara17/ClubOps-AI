import { Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import type { IconComponent } from "@/types";

export interface ModulePlaceholderPageProps {
  title: string;
  description: string;
  icon?: IconComponent;
}

/**
 * Placeholder route used while a module has not been implemented yet.
 * Each module replaces this with its real page in a later commit.
 */
export default function ModulePlaceholderPage({
  title,
  description,
  icon = Construction,
}: ModulePlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module"
        title={title}
        description={description}
        meta={<Badge tone="warning">Not implemented yet</Badge>}
      />
      <EmptyState
        variant="page"
        icon={icon}
        title={`${title} ships in a later commit`}
        description="Part 01 delivers the design system and application shell only. This route exists so navigation and layout can be validated end to end."
        actions={
          <Button variant="outline" onClick={() => navigate("/foundation")}>
            View design foundation
          </Button>
        }
      />
    </div>
  );
}
