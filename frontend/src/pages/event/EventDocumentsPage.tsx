import { useState } from "react";
import {
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  Plus,
  Search,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { useCurrentEvent } from "@/hooks/useCurrentEvent";

interface EventDocument {
  id: string;
  title: string;
  category: "permits" | "contracts" | "runsheets" | "safety";
  fileName: string;
  size: string;
  owner: string;
  updatedDate: string;
  status: "signed" | "pending" | "review";
}

const INITIAL_DOCUMENTS: EventDocument[] = [
  {
    id: "DOC-01",
    title: "Venue Safety & Occupancy Certificate 2026",
    category: "permits",
    fileName: "TF26_Safety_Occupancy_Cert.pdf",
    size: "2.4 MB",
    owner: "Priya N.",
    updatedDate: "Yesterday",
    status: "pending",
  },
  {
    id: "DOC-02",
    title: "Campus Innovation Hall Lease Agreement",
    category: "contracts",
    fileName: "Campus_Hall_Lease_Agreement_Executed.pdf",
    size: "4.1 MB",
    owner: "Marcus L.",
    updatedDate: "3 days ago",
    status: "signed",
  },
  {
    id: "DOC-03",
    title: "TechFest 2026 Master Production Run Sheet v4.2",
    category: "runsheets",
    fileName: "TechFest_Master_RunSheet_v4.2.pdf",
    size: "1.8 MB",
    owner: "Tomás B.",
    updatedDate: "Today",
    status: "signed",
  },
  {
    id: "DOC-04",
    title: "Audio Visual & Lighting Services Contract",
    category: "contracts",
    fileName: "AV_Lighting_Contract_Signed.pdf",
    size: "3.2 MB",
    owner: "Marcus L.",
    updatedDate: "Last week",
    status: "signed",
  },
  {
    id: "DOC-05",
    title: "Food Truck & Campus Catering Hygiene Permit",
    category: "permits",
    fileName: "Catering_Hygiene_Endorsement.pdf",
    size: "1.1 MB",
    owner: "Rina K.",
    updatedDate: "2 days ago",
    status: "review",
  },
  {
    id: "DOC-06",
    title: "Public Liability Insurance Certificate of Currency",
    category: "safety",
    fileName: "Public_Liability_2026_Endorsed.pdf",
    size: "850 KB",
    owner: "Priya N.",
    updatedDate: "Last month",
    status: "signed",
  },
];

const CATEGORIES = [
  { id: "all", name: "All files" },
  { id: "permits", name: "Permits & licences" },
  { id: "contracts", name: "Contracts" },
  { id: "runsheets", name: "Run sheets" },
  { id: "safety", name: "Insurance & Safety" },
];

export default function EventDocumentsPage() {
  const event = useCurrentEvent();
  const [documents, setDocuments] = useState<EventDocument[]>(INITIAL_DOCUMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // New doc form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"permits" | "contracts" | "runsheets" | "safety">("permits");
  const [newOwner, setNewOwner] = useState("");
  const [newFileName, setNewFileName] = useState("");

  const handleDownload = (doc: EventDocument) => {
    setDownloadNotice(`Downloading ${doc.fileName}...`);
    setTimeout(() => setDownloadNotice(null), 2500);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: EventDocument = {
      id: `DOC-${String(documents.length + 1).padStart(2, "0")}`,
      title: newTitle.trim(),
      category: newCategory,
      fileName: newFileName.trim() || `${newTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      size: "1.5 MB",
      owner: newOwner.trim() || "Unassigned",
      updatedDate: "Just now",
      status: "review",
    };

    setDocuments([newDoc, ...documents]);
    setNewTitle("");
    setNewFileName("");
    setNewOwner("");
    setIsUploadModalOpen(false);
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const reviewCount = documents.filter((d) => d.status === "review").length;

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        divider={false}
        title="Documents"
        description={`Store compliance permits, vendor agreements, and crew run sheets for ${event.name}.`}
        actions={
          <Button leadingIcon={Upload} onClick={() => setIsUploadModalOpen(true)}>
            Upload document
          </Button>
        }
      />

      {downloadNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
          {downloadNotice}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Stored documents"
          value={documents.length.toString()}
          hint="All compliance records archived"
          icon={FileText}
          tone="brand"
        />
        <StatCard
          label="Awaiting signature"
          value={pendingCount.toString()}
          hint="Venue Safety Certificate due tomorrow"
          icon={FileCheck2}
          tone="danger"
        />
        <StatCard
          label="Under review"
          value={reviewCount.toString()}
          hint="Catering and vendor permits"
          icon={FileCheck2}
          tone="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Document Library Table */}
        <div className="space-y-4 lg:col-span-2">
          {/* Search and Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search width={16} height={16} className="text-fg-subtle shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title, file name, or owner..."
                className="w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-fg-subtle hover:text-fg p-1"
                >
                  <X width={14} height={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                    selectedCategory === cat.id
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface-subtle text-fg-muted hover:bg-surface-inset"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Document Cards */}
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="transition-all hover:border-line-strong">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <FileText width={20} height={20} />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-fg-subtle">
                          {doc.id}
                        </span>
                        <h4 className="text-sm font-bold text-fg truncate">{doc.title}</h4>
                        {doc.status === "signed" ? (
                          <Badge tone="success" size="sm">
                            Signed
                          </Badge>
                        ) : doc.status === "pending" ? (
                          <Badge tone="danger" size="sm">
                            Awaiting Signature
                          </Badge>
                        ) : (
                          <Badge tone="warning" size="sm">
                            Under Review
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted font-mono">
                        <span>{doc.fileName}</span>
                        <span>{doc.size}</span>
                        <span className="flex items-center gap-1">
                          <User width={12} height={12} className="text-fg-subtle" />
                          {doc.owner}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock width={12} height={12} className="text-fg-subtle" />
                          {doc.updatedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      leadingIcon={Download}
                      onClick={() => handleDownload(doc)}
                      title="Download PDF file"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredDocs.length === 0 && (
              <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center text-xs text-fg-subtle">
                No documents found in this view.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Categories & Compliance Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Regulatory Compliance</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1.5 text-rose-800">
                <p className="font-bold flex items-center gap-1.5">
                  <FileCheck2 width={14} height={14} className="text-rose-600" />
                  Urgent Action Required
                </p>
                <p className="leading-relaxed">
                  <strong>Venue Safety & Occupancy Certificate</strong> is due tomorrow for building access clearance. Assigned to Priya N.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface-subtle p-3 space-y-1 text-fg-muted">
                <p className="font-bold text-fg">Storage Policy</p>
                <p>All executed contracts are permanently encrypted and accessible only to verified steering committee members.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-base font-bold text-fg">Upload Event Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-fg-subtle hover:text-fg p-1 rounded-lg hover:bg-surface-subtle"
              >
                <X width={18} height={18} />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-fg mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Stage Sound Ordinance Permit"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-fg mb-1">File Name</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. Stage_Sound_Permit_Signed.pdf"
                  className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-fg mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  >
                    <option value="permits">Permits & Licences</option>
                    <option value="contracts">Contracts</option>
                    <option value="runsheets">Run Sheets</option>
                    <option value="safety">Insurance & Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-fg mb-1">Responsible Lead</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. Priya N."
                    className="w-full rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-6">
                <Button variant="outline" type="button" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Upload Document</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
