import type { ReactNode } from "react";

/**
 * Minimal, allow-listed markdown renderer for copilot output.
 *
 * Supports headings (#, ##, ###), bullet and numbered lists, paragraphs,
 * **bold**, _italic_ and `inline code`. Everything is emitted as React text
 * nodes — no HTML parsing, no dangerouslySetInnerHTML — so backend content
 * can never inject markup. Unknown syntax is shown as literal text.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("**")) nodes.push(<strong key={key} className="font-semibold text-fg">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) nodes.push(<code key={key} className="rounded bg-surface-inset px-1 py-0.5 font-mono text-[12px]">{token.slice(1, -1)}</code>);
    else nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "list", ...list });
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1]!.length as 1 | 2 | 3, text: heading[2]! });
    } else if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const item = (bullet ?? numbered)![1]!;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function SafeMarkdown({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-fg">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        if (block.type === "heading") {
          const className =
            block.level === 1 ? "text-base font-semibold" : block.level === 2 ? "text-sm font-semibold" : "text-xs font-semibold uppercase tracking-wide text-fg-muted";
          return <p key={key} role="heading" aria-level={block.level + 2} className={className}>{renderInline(block.text, key)}</p>;
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={key} className={block.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
              {block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}
            </Tag>
          );
        }
        return <p key={key} className={block.text.startsWith("_") && block.text.endsWith("_") ? "text-xs text-fg-subtle" : undefined}>{renderInline(block.text, key)}</p>;
      })}
    </div>
  );
}
