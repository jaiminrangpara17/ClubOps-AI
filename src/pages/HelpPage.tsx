import { ChevronDown, LifeBuoy, MessageCircleQuestion, Search, Send, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, PageHeader } from "@/components/ui";
import { HELP_ARTICLES, HELP_CATEGORIES, HELP_FAQS, TROUBLESHOOTING_ITEMS } from "@/data/helpContent";
import type { HelpArticle } from "@/types";

const CONTACT_CATEGORIES = [
  "Account & Access",
  "Event Management",
  "Tasks",
  "Volunteers",
  "Meetings",
  "Documents",
  "Risks",
  "AI",
  "Technical Issue",
  "Other",
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  "Getting Started": "01",
  Events: "02",
  Tasks: "03",
  Volunteers: "04",
  Meetings: "05",
  Documents: "06",
  Risks: "07",
  Announcements: "08",
  "AI Copilot": "09",
  "AI Actions": "10",
  "Account & Access": "11",
  Troubleshooting: "12",
};

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge tone="brand" variant="outline">{article.category}</Badge>
          <span className="font-mono text-[11px] text-fg-subtle">{CATEGORY_ICONS[article.category]}</span>
        </div>
        <h3 className="mt-4 text-sm font-semibold text-fg">{article.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{article.summary}</p>
        <ol className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
          {article.steps.slice(0, 3).map((step, index) => (
            <li key={step} className="flex gap-2.5 text-xs text-fg-muted">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-inset text-[10px] font-semibold text-fg-subtle">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span>{question}</span>
        <ChevronDown width={16} height={16} aria-hidden className={`shrink-0 text-fg-subtle transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="max-w-3xl pb-4 pr-8 text-sm leading-relaxed text-fg-muted">{answer}</p>}
    </div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All help");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [contactCategory, setContactCategory] = useState<string>(CONTACT_CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const matches = useMemo(() => {
    const matchesArticle = (article: HelpArticle) => {
      const categoryMatch = category === "All help" || article.category === category;
      const queryMatch = !normalizedQuery || [article.title, article.summary, article.category, ...article.keywords].join(" ").toLowerCase().includes(normalizedQuery);
      return categoryMatch && queryMatch;
    };
    return HELP_ARTICLES.filter(matchesArticle);
  }, [category, normalizedQuery]);

  const matchingFaqs = useMemo(() => HELP_FAQS.filter((faq) => {
    const categoryMatch = category === "All help" || faq.category === category;
    const queryMatch = !normalizedQuery || `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(normalizedQuery);
    return categoryMatch && queryMatch;
  }), [category, normalizedQuery]);

  const matchingTroubleshooting = useMemo(() => TROUBLESHOOTING_ITEMS.filter((item) => {
    const categoryMatch = category === "All help" || category === "Troubleshooting";
    const queryMatch = !normalizedQuery || `${item.title} ${item.symptoms} ${item.steps.join(" ")}`.toLowerCase().includes(normalizedQuery);
    return categoryMatch && queryMatch;
  }), [category, normalizedQuery]);

  const hasSearch = Boolean(normalizedQuery || category !== "All help");
  const totalResults = matches.length + matchingFaqs.length + matchingTroubleshooting.length;

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        eyebrow="Support center"
        title="Help & Support"
        description="Find answers, learn how ClubOps AI works, or contact your support team."
        meta={<Badge tone="neutral" variant="outline">Self-service help</Badge>}
      />

      <Card variant="subtle" className="overflow-hidden">
        <CardContent className="p-5 sm:p-7">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-brand uppercase">Find your way around</p>
            <h2 className="mt-2 text-xl font-semibold text-fg">What can we help you with?</h2>
            <p className="mt-1.5 text-sm text-fg-muted">Search the product guide or browse a category below.</p>
            <div className="mt-5">
              <Input
                label="Search help articles"
                leadingIcon={Search}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by topic, feature, or question…"
                containerClassName="max-w-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearch ? (
        <section className="space-y-4" aria-labelledby="help-results-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 id="help-results-heading" className="text-base font-semibold text-fg">Search results</h2>
              <p className="mt-1 text-sm text-fg-muted">{totalResults} result{totalResults === 1 ? "" : "s"} found.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("All help"); }}>Clear search</Button>
          </div>
          {totalResults === 0 ? (
            <EmptyState title="No help articles found" description="Try a different search term or contact support below." />
          ) : (
            <>
              {matches.length > 0 && <div className="grid gap-4 md:grid-cols-2">{matches.map((article) => <ArticleCard key={article.id} article={article} />)}</div>}
              {matchingFaqs.length > 0 && <Card padding="lg"><h3 className="text-sm font-semibold text-fg">Matching FAQs</h3>{matchingFaqs.map((faq) => <AccordionItem key={faq.id} question={faq.question} answer={faq.answer} open={openFaq === faq.id} onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} />)}</Card>}
              {matchingTroubleshooting.length > 0 && <Card padding="lg"><h3 className="text-sm font-semibold text-fg">Matching troubleshooting</h3><div className="mt-3 space-y-3">{matchingTroubleshooting.map((item) => <details key={item.id} className="rounded-control border border-line bg-surface-subtle px-3"><summary className="cursor-pointer list-none py-3 text-sm font-medium text-fg">{item.title}</summary><div className="border-t border-line pb-3 pt-2"><p className="text-xs text-fg-muted">{item.symptoms}</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-fg-muted">{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></details>)}</div></Card>}
            </>
          )}
        </section>
      ) : (
        <section aria-labelledby="help-categories-heading">
          <div className="mb-4">
            <h2 id="help-categories-heading" className="text-base font-semibold text-fg">Browse by category</h2>
            <p className="mt-1 text-sm text-fg-muted">Start with the area where you need a hand.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["All help", ...HELP_CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className="group flex items-center gap-3 rounded-card border border-line bg-surface p-4 text-left shadow-xs transition-colors hover:border-brand/40 hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-soft text-xs font-semibold text-brand-soft-fg">
                  {item === "All help" ? "✦" : CATEGORY_ICONS[item]}
                </span>
                <span className="min-w-0"><span className="block text-sm font-medium text-fg">{item}</span><span className="mt-0.5 block text-xs text-fg-subtle">Browse helpful guidance</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!hasSearch && (
        <section className="space-y-4" aria-labelledby="popular-heading">
          <div><h2 id="popular-heading" className="text-base font-semibold text-fg">Popular articles</h2><p className="mt-1 text-sm text-fg-muted">Practical guidance for the workflows teams use most.</p></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{HELP_ARTICLES.slice(0, 6).map((article) => <ArticleCard key={article.id} article={article} />)}</div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2" aria-label="Frequently asked questions and troubleshooting">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircleQuestion width={16} height={16} aria-hidden className="text-fg-subtle" />Frequently asked questions</CardTitle></CardHeader>
          <CardContent>{HELP_FAQS.map((faq) => <AccordionItem key={faq.id} question={faq.question} answer={faq.answer} open={openFaq === faq.id} onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} />)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wrench width={16} height={16} aria-hidden className="text-fg-subtle" />Troubleshooting</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {TROUBLESHOOTING_ITEMS.map((item) => <details key={item.id} className="group rounded-control border border-line bg-surface-subtle px-3"><summary className="cursor-pointer list-none py-3 text-sm font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{item.title}</summary><div className="border-t border-line pb-3 pt-2"><p className="text-xs text-fg-muted">{item.symptoms}</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-fg-muted">{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></details>)}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="contact-support-heading">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy width={16} height={16} aria-hidden className="text-fg-subtle" />Contact Support</CardTitle><p className="text-sm text-fg-muted">Can&apos;t find what you need? Tell us what is blocking your work.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-control border border-info/25 bg-info-soft px-3 py-2.5 text-sm text-fg-muted">Support request submission is not connected in this frontend build. Your form can be prepared below, but it will not be sent until the backend support endpoint is available.</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What do you need help with?" />
              <div><label htmlFor="support-category" className="block text-xs font-medium text-fg-muted">Category</label><select id="support-category" value={contactCategory} onChange={(event) => setContactCategory(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-fg shadow-xs focus:border-brand focus:outline-none"><option>{CONTACT_CATEGORIES[0]}</option>{CONTACT_CATEGORIES.slice(1).map((item) => <option key={item}>{item}</option>)}</select></div>
            </div>
            <div><label htmlFor="support-description" className="block text-xs font-medium text-fg-muted">Description</label><textarea id="support-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what happened and what you expected." className="mt-1.5 w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none" /></div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"><p className="text-xs text-fg-subtle">Contact your workspace administrator while support requests are being connected.</p><Button leadingIcon={Send} disabled title="Support request endpoint is not available">Submit request</Button></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}