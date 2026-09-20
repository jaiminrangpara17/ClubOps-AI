import { Archive, FilePenLine, Megaphone, Send } from "lucide-react";
import { StatCard } from "@/components/ui";
import type { AnnouncementStats as AnnouncementStatsData } from "@/types";

export function AnnouncementStats({ stats }: { stats: AnnouncementStatsData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total" value={stats.total} hint="In this event" icon={Megaphone} tone="brand" />
      <StatCard label="Published" value={stats.published} hint="Visible to audience" icon={Send} tone="success" />
      <StatCard label="Drafts" value={stats.drafts} hint="Editors only" icon={FilePenLine} tone="neutral" />
      <StatCard label="Archived" value={stats.archived} hint="No longer current" icon={Archive} tone="info" />
    </div>
  );
}
