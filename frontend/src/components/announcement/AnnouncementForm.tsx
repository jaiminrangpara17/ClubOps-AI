import { useState } from "react";
import { Button, Input } from "@/components/ui";
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementCapabilities,
  AnnouncementCategory,
  AnnouncementPriority,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "@/types";

const CONTROL =
  "mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const TITLE_MIN = 3;
const TITLE_MAX = 140;
const BODY_MIN = 8;

export function AnnouncementForm({
  announcement,
  capabilities,
  onSubmit,
  onCancel,
  loading,
}: {
  announcement?: Announcement;
  capabilities: AnnouncementCapabilities;
  onSubmit: (request: CreateAnnouncementRequest | UpdateAnnouncementRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [priority, setPriority] = useState<AnnouncementPriority>(announcement?.priority ?? "normal");
  const [category, setCategory] = useState<AnnouncementCategory>(announcement?.category ?? "general");
  const [audience, setAudience] = useState<AnnouncementAudience>(
    announcement?.audience ?? "event_team",
  );
  const [publishNow, setPublishNow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (cleanTitle.length < TITLE_MIN) next.title = `Title must be at least ${TITLE_MIN} characters.`;
    if (cleanTitle.length > TITLE_MAX) next.title = `Title cannot exceed ${TITLE_MAX} characters.`;
    if (cleanBody.length < BODY_MIN) next.body = `Content must be at least ${BODY_MIN} characters.`;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    await onSubmit({
      title: cleanTitle,
      body: cleanBody,
      priority,
      category,
      audience,
      ...(!announcement && capabilities.publish ? { publish: publishNow } : {}),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input
        label="Title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Volunteer briefing moved to Maker Lab B2"
        error={errors.title}
      />

      <div>
        <label htmlFor="announcement-body" className="block text-xs font-medium text-fg-muted">
          Content <span className="text-danger">*</span>
        </label>
        <textarea
          id="announcement-body"
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write the update in plain text. Separate paragraphs with a blank line."
          className="mt-1.5 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-fg shadow-xs hover:border-line-strong focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        {errors.body && <p className="mt-1.5 text-xs font-medium text-danger">{errors.body}</p>}
        <p className="mt-1.5 text-xs text-fg-subtle">Plain text only. This is not delivered by email, SMS or push.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="announcement-priority" className="block text-xs font-medium text-fg-muted">
            Priority
          </label>
          <select
            id="announcement-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as AnnouncementPriority)}
            className={CONTROL}
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label htmlFor="announcement-category" className="block text-xs font-medium text-fg-muted">
            Category
          </label>
          <select
            id="announcement-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as AnnouncementCategory)}
            className={CONTROL}
          >
            <option value="general">General</option>
            <option value="operations">Operations</option>
            <option value="reminder">Reminder</option>
            <option value="decision">Decision</option>
          </select>
        </div>
        <div>
          <label htmlFor="announcement-audience" className="block text-xs font-medium text-fg-muted">
            Audience
          </label>
          <select
            id="announcement-audience"
            value={audience}
            onChange={(event) => setAudience(event.target.value as AnnouncementAudience)}
            className={CONTROL}
          >
            <option value="event_team">Entire event team</option>
            <option value="organizers">Organizers</option>
            <option value="volunteers">Volunteers</option>
          </select>
          <p className="mt-1.5 text-xs text-fg-subtle">Controls who this announcement is for. It does not send a message.</p>
        </div>
      </div>

      {!announcement && capabilities.publish && (
        <label htmlFor="announcement-publish" className="flex items-start gap-2 rounded-control border border-line bg-surface-subtle px-3 py-2.5 text-sm text-fg">
          <input
            id="announcement-publish"
            type="checkbox"
            checked={publishNow}
            onChange={(event) => setPublishNow(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 accent-brand-600"
          />
          <span>
            Publish immediately
            <span className="mt-0.5 block text-xs text-fg-subtle">
              Leave unchecked to save as a draft. Publishing is confirmed only after the server responds.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {announcement ? "Save changes" : publishNow ? "Create and publish" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}
