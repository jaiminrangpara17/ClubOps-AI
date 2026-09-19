import { FileCheck2, FileText, FolderOpen, Upload } from "lucide-react";
import { PlannedCapabilities } from "@/components/common/PlannedCapabilities";
import { PreviewNotice } from "@/components/common/PreviewNotice";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";

const CATEGORIES = [
  { id: "permits", name: "Permits & licences", detail: "Venue, safety and noise approvals" },
  { id: "contracts", name: "Contracts", detail: "Suppliers, sponsors and vendors" },
  { id: "runsheets", name: "Run sheets", detail: "Schedules and crew briefing packs" },
];

export default function EventDocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Documents"
        description="Store permits, contracts, run sheets and policies in one library."
        actions={
          <Button leadingIcon={Upload} disabled title="Uploads ship with the documents module">
            Upload document
          </Button>
        }
      />

      <PreviewNotice />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Stored files" value="—" hint="Awaiting data" icon={FileText} tone="brand" />
        <StatCard label="Awaiting signature" value="—" hint="Awaiting data" icon={FileCheck2} tone="warning" />
        <StatCard label="Expiring soon" value="—" hint="Awaiting data" icon={FileCheck2} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Library structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {CATEGORIES.map((category) => (
                <div
                  key={category.id}
                  className="rounded-control border border-dashed border-line-strong bg-surface-subtle p-3.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-control bg-surface text-fg-subtle">
                    <FolderOpen width={15} height={15} aria-hidden />
                  </span>
                  <p className="mt-2 text-sm font-medium text-fg">{category.name}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">{category.detail}</p>
                </div>
              ))}
            </div>
            <EmptyState
              icon={FileText}
              title="No documents uploaded"
              description="Uploaded files will be versioned, categorised and linked to the tasks or risks that depend on them."
            />
          </CardContent>
        </Card>

        <PlannedCapabilities
          items={[
            "Drag-and-drop upload with versioning",
            "Expiry and signature reminders",
            "Category and tag based filtering",
            "Document references from tasks and risks",
          ]}
        />
      </div>
    </div>
  );
}
