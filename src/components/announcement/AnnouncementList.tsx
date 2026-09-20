import { CalendarDays, Megaphone, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/format";
import type { Announcement } from "@/types";
import {
  AnnouncementAudienceBadge,
  AnnouncementPriorityBadge,
  AnnouncementStatusBadge,
} from "./AnnouncementBadges";

export function AnnouncementTable({
  eventId,
  announcements,
}: {
  eventId: string;
  announcements: Announcement[];
}) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-line bg-surface md:block">
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-line bg-surface-subtle">
          <tr>
            {["Announcement", "Status", "Priority", "Audience", "Author", "Published"].map((label) => (
              <th
                key={label}
                scope="col"
                className="px-4 py-2.5 text-left text-xs font-semibold text-fg-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {announcements.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-surface-subtle">
              <td className="max-w-[320px] px-4 py-3">
                <Link
                  to={`/events/${eventId}/announcements/${item.id}`}
                  className="block truncate text-sm font-medium text-fg underline-offset-4 hover:text-brand hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-0.5 line-clamp-1 text-xs text-fg-subtle">{item.body}</p>
              </td>
              <td className="px-4 py-3">
                <AnnouncementStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                <AnnouncementPriorityBadge priority={item.priority} />
              </td>
              <td className="px-4 py-3">
                <AnnouncementAudienceBadge audience={item.audience} />
              </td>
              <td className="px-4 py-3 text-xs text-fg">{item.authorName ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-fg-muted">
                {item.publishedAt ? formatDate(item.publishedAt) : "Not published"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnnouncementCards({
  eventId,
  announcements,
}: {
  eventId: string;
  announcements: Announcement[];
}) {
  const navigate = useNavigate();
  return (
    <div className="grid gap-3 md:hidden">
      {announcements.map((item) => (
        <article key={item.id} className="rounded-card border border-line bg-surface p-4 shadow-xs">
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => navigate(`/events/${eventId}/announcements/${item.id}`)}
          >
            <div className="flex items-start gap-2">
              <Megaphone
                width={16}
                height={16}
                aria-hidden
                className="mt-0.5 shrink-0 text-fg-subtle"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-fg">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{item.body}</p>
              </div>
            </div>
          </button>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <AnnouncementStatusBadge status={item.status} />
            <AnnouncementPriorityBadge priority={item.priority} />
            <AnnouncementAudienceBadge audience={item.audience} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-fg-muted">
            <span className="flex items-center gap-1">
              <UserRound width={11} height={11} aria-hidden />
              {item.authorName ?? "Unknown author"}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays width={11} height={11} aria-hidden />
              {item.publishedAt ? formatDate(item.publishedAt) : "Not published"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
