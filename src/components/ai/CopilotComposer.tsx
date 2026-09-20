import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";

const MAX_LENGTH = 2000;

export function CopilotComposer({
  disabled,
  busy,
  onSend,
  placeholder,
}: {
  disabled: boolean;
  busy: boolean;
  onSend: (text: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const canSend = !disabled && !busy && draft.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="border-t border-line bg-surface p-3"
    >
      <label htmlFor="copilot-input" className="sr-only">
        Ask ClubOps AI about this event
      </label>
      <div className="flex items-end gap-2 rounded-control border border-line bg-surface-inset px-3 py-2 focus-within:border-brand">
        <textarea
          id="copilot-input"
          rows={1}
          value={draft}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="max-h-40 min-h-[2.25rem] min-w-0 flex-1 resize-y bg-transparent py-1 text-sm text-fg placeholder:text-fg-subtle focus:outline-none disabled:cursor-not-allowed"
        />
        <Button
          type="submit"
          size="sm"
          iconOnly
          leadingIcon={Send}
          aria-label="Send message"
          disabled={!canSend}
          loading={busy}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-fg-subtle">
        <span>Enter to send · Shift+Enter for a new line</span>
        <span className="tabular-nums">{draft.length}/{MAX_LENGTH}</span>
      </div>
    </form>
  );
}
