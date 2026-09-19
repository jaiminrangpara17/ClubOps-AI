const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

const MS_PER_DAY = 86_400_000;

export function formatDate(iso: string): string {
  return DAY_MONTH_YEAR.format(new Date(iso));
}

/** "12–14 Mar 2026" when inside one month, otherwise two full dates. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (start.toDateString() === end.toDateString()) return DAY_MONTH_YEAR.format(start);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) return `${start.getDate()}–${DAY_MONTH_YEAR.format(end)}`;
  if (sameYear) return `${DAY_MONTH.format(start)} – ${DAY_MONTH_YEAR.format(end)}`;
  return `${DAY_MONTH_YEAR.format(start)} – ${DAY_MONTH_YEAR.format(end)}`;
}

/** Whole-day difference between now and the given date. */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

export function formatDueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < -1) return `Overdue by ${Math.abs(days)} days`;
  if (days === -1) return "Overdue by 1 day";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${formatDate(iso)}`;
}

export function formatCountdown(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return "Completed";
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}
