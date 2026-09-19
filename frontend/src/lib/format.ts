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

/* ------------------------------------------------------------------ */
/* Due-date bucketing                                                  */
/*                                                                     */
/* The single place that classifies a deadline relative to today.       */
/* Components must never compare date strings or reimplement this.      */
/* ------------------------------------------------------------------ */

export type DueBucket = "overdue" | "today" | "tomorrow" | "due-soon" | "future";

/** Days from today that still counts as "due soon". */
const DUE_SOON_WINDOW_DAYS = 7;

/** Classifies a deadline using real Date arithmetic (never string compare). */
export function dueBucket(iso: string, now: Date = new Date()): DueBucket {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return "future";

  const startOfDay = (date: Date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
  };

  const diffDays = Math.round(
    (startOfDay(target) - startOfDay(now)) / MS_PER_DAY,
  );

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "due-soon";
  return "future";
}

const SHORT_DAY_MONTH = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

/** Short uppercase bucket heading, e.g. "TODAY", "TOMORROW", "25 SEP". */
export function dueBucketHeading(iso: string, now: Date = new Date()): string {
  switch (dueBucket(iso, now)) {
    case "overdue":
      return "OVERDUE";
    case "today":
      return "TODAY";
    case "tomorrow":
      return "TOMORROW";
    default:
      return SHORT_DAY_MONTH.format(new Date(iso)).toUpperCase();
  }
}

/** Sort order for deadlines: most urgent first, undated last. */
export function compareByDueDate(a: string, b: string): number {
  const timeA = Date.parse(a);
  const timeB = Date.parse(b);
  const safeA = Number.isNaN(timeA) ? Number.POSITIVE_INFINITY : timeA;
  const safeB = Number.isNaN(timeB) ? Number.POSITIVE_INFINITY : timeB;
  return safeA - safeB;
}
