import { CircleDashed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface PlannedCapabilitiesProps {
  title?: string;
  items: string[];
  className?: string;
}

/** Lists what a module will do once implemented — used by preview screens. */
export function PlannedCapabilities({
  title = "Planned in this module",
  items,
  className,
}: PlannedCapabilitiesProps) {
  return (
    <Card variant="subtle" className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-fg-muted">
              <CircleDashed
                width={15}
                height={15}
                aria-hidden
                className="mt-0.5 shrink-0 text-fg-subtle"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
