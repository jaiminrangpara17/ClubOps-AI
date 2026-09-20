/**
 * Task empty states — two variants:
 * - No tasks exist at all
 * - Filters returned no matches
 */
import { ListChecks, Plus, RotateCcw } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export interface TaskEmptyStateProps {
  variant: "empty" | "no_matches";
  onCreate?: () => void;
  onClearFilters?: () => void;
}

export function TaskEmptyState({ variant, onCreate, onClearFilters }: TaskEmptyStateProps) {
  if (variant === "no_matches") {
    return (
      <EmptyState
        icon={ListChecks}
        title="No matching tasks"
        description="Try changing or clearing your filters to see more results."
        actions={
          onClearFilters && (
            <Button variant="outline" leadingIcon={RotateCcw} onClick={onClearFilters}>
              Clear filters
            </Button>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      icon={ListChecks}
      title="No tasks yet"
      description="Break this event into clear responsibilities so everyone knows what needs to happen next."
      actions={
        onCreate && (
          <Button leadingIcon={Plus} onClick={onCreate}>
            Create first task
          </Button>
        )
      }
    />
  );
}
