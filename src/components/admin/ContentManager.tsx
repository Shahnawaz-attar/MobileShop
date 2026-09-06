"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementAction,
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
  toggleTestimonialAction,
} from "@/server/modules/content/actions";
import {
  Megaphone,
  MessageSquareQuote,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Check,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface AnnouncementItem {
  id: string;
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

interface TestimonialItem {
  id: string;
  customerName: string;
  text: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

type ActiveTab = "announcements" | "testimonials";

interface ContentManagerProps {
  announcements: AnnouncementItem[];
  testimonials: TestimonialItem[];
  brands?: { id: string, name: string, slug: string }[];
}

// ─── Constants & Shared Styles ──────────────────────────────────────

const PAGE_SIZE = 10;

const inputClass =
  "w-full rounded-xl border border-input/50 bg-background/50 px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-input focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10";
const labelClass = "block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5";
const cardClass = "rounded-2xl border border-border/50 bg-card/40 p-5 shadow-sm backdrop-blur-xl transition-all";

// ─── Main Component ─────────────────────────────────────────────────

export function ContentManager({ announcements, testimonials, brands }: ContentManagerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("announcements");

  const tabs: { id: ActiveTab; label: string; icon: typeof Megaphone; count: number }[] = [
    { id: "announcements", label: "Announcements", icon: Megaphone, count: announcements.length },
    { id: "testimonials", label: "Testimonials", icon: MessageSquareQuote, count: testimonials.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-border/50 bg-card/30 p-1.5 backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "announcements" && <AnnouncementPanel items={announcements} brands={brands} />}
      {activeTab === "testimonials" && <TestimonialPanel items={testimonials} />}
    </div>
  );
}

// ─── Announcement Panel ─────────────────────────────────────────────

function AnnouncementPanel({ items, brands }: { items: AnnouncementItem[], brands?: { id: string, name: string, slug: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Shop Now");
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState<Date | undefined>();
  const [endsAt, setEndsAt] = useState<Date | undefined>();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  function openCreate() {
    setEditingItem(null);
    setTitle("");
    setBody("");
    setCtaLabel("Shop Now");
    setIsActive(true);
    setStartsAt(undefined);
    setEndsAt(undefined);
    setSelectedBrands([]);
    setShowForm(true);
  }

  function openEdit(item: AnnouncementItem) {
    setEditingItem(item);
    setTitle(item.title);
    setBody(item.body || "");
    setCtaLabel(item.ctaLabel || "");
    setIsActive(item.isActive);
    setStartsAt(item.startsAt ? new Date(item.startsAt) : undefined);
    setEndsAt(item.endsAt ? new Date(item.endsAt) : undefined);
    
    // Parse selected brands from ctaHref
    const href = item.ctaHref || "";
    if (href.includes("?brands=")) {
      try {
        const searchParams = new URLSearchParams(href.split("?")[1]);
        const brandsStr = searchParams.get("brands");
        setSelectedBrands(brandsStr ? brandsStr.split(",") : []);
      } catch {
        setSelectedBrands([]);
      }
    } else {
      setSelectedBrands([]);
    }
    
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      let finalHref = "/phones";
      if (selectedBrands.length > 0) {
        const params = new URLSearchParams();
        params.set("brands", selectedBrands.join(","));
        finalHref = `/phones?${params.toString()}`;
      } else if (!ctaLabel) {
        finalHref = "";
      }

      const payload = { 
        title, 
        body, 
        ctaLabel, 
        ctaHref: finalHref, 
        isActive, 
        startsAt: startsAt || null, 
        endsAt: endsAt || null 
      };
      const result = editingItem
        ? await updateAnnouncementAction(editingItem.id, payload)
        : await createAnnouncementAction(payload);

      if (result.success) {
        toast.success(editingItem ? "Announcement updated" : "Announcement created");
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleAnnouncementAction(id, !current);
      if (result.success) {
        toast.success(current ? "Announcement hidden" : "Announcement visible");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteAnnouncementAction(deleteId);
      if (result.success) {
        toast.success("Announcement deleted");
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(result.error);
        setDeleteId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {/* Form (inline) */}
      {showForm && (
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">{editingItem ? "Edit" : "New"} Announcement</h3>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Banner Text *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="🎉 Grand Diwali Sale — Up to 30% OFF!" />
            </div>
            <div>
              <label className={labelClass}>Description (optional)</label>
              <textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} className={inputClass} placeholder="Valid till 31st October. T&C apply." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Button Label</label>
                <input type="text" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputClass} placeholder="Shop Now" />
              </div>
              <div>
                <label className={labelClass}>Target Brands (Optional)</label>
                <div className="mt-2">
                  <MultiSelect
                    options={brands?.map((b) => ({ id: b.id, label: b.name, value: b.slug })) || []}
                    selected={selectedBrands}
                    onChange={setSelectedBrands}
                    placeholder="Select brands..."
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  If selected, the button will link to these specific brands on the website.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className={labelClass}>Starts At (optional)</label>
                <DatePicker 
                  value={startsAt} 
                  onChange={setStartsAt} 
                  placeholder="Pick a start date" 
                />
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Ends At (optional)</label>
                <DatePicker 
                  value={endsAt} 
                  onChange={setEndsAt} 
                  placeholder="Pick an end date" 
                />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
              <span className="text-sm font-medium text-foreground">Active (show on website)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingItem ? "Save Changes" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {items.length === 0 && !showForm && (
        <div className={`${cardClass} text-center py-12`}>
          <Megaphone className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Create one to display a banner on your website.</p>
        </div>
      )}

      {visibleItems.map((item) => {
        let status = "HIDDEN";
        let statusClass = "bg-muted text-muted-foreground";
        
        if (item.isActive) {
          const now = new Date();
          const start = item.startsAt ? new Date(item.startsAt) : null;
          const end = item.endsAt ? new Date(item.endsAt) : null;
          
          if (end && end < now) {
            status = "EXPIRED";
            statusClass = "bg-orange-500/10 text-orange-500";
          } else if (start && start > now) {
            status = "SCHEDULED";
            statusClass = "bg-blue-500/10 text-blue-500";
          } else {
            status = "ACTIVE";
            statusClass = "bg-emerald-500/10 text-emerald-500";
          }
        }

        return (
        <div key={item.id} className={`${cardClass} flex items-start justify-between gap-4`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                {status}
              </span>
              {(item.startsAt || item.endsAt) && (
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {item.startsAt ? new Date(item.startsAt).toLocaleDateString() : "Now"} → {item.endsAt ? new Date(item.endsAt).toLocaleDateString() : "Forever"}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-foreground truncate">{item.title}</p>
            {item.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.body}</p>}
            {item.ctaLabel && (
              <p className="text-xs text-primary mt-1">{item.ctaLabel} → {item.ctaHref}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => handleToggle(item.id, item.isActive)} disabled={isPending} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors" title={item.isActive ? "Hide" : "Show"}>
              {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors" title="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-destructive/70 hover:bg-destructive/10 transition-colors" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )})}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="rounded-xl border border-border/50 px-6 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Show more ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Announcement"
        description="This announcement will be permanently removed. This cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ─── Testimonial Panel ──────────────────────────────────────────────

function TestimonialPanel({ items }: { items: TestimonialItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [text, setText] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  function openCreate() {
    setEditingItem(null);
    setCustomerName("");
    setText("");
    setIsPublished(true);
    setSortOrder(items.length);
    setShowForm(true);
  }

  function openEdit(item: TestimonialItem) {
    setEditingItem(item);
    setCustomerName(item.customerName);
    setText(item.text);
    setIsPublished(item.isPublished);
    setSortOrder(item.sortOrder);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = { customerName, text, isPublished, sortOrder };
      const result = editingItem
        ? await updateTestimonialAction(editingItem.id, payload)
        : await createTestimonialAction(payload);

      if (result.success) {
        toast.success(editingItem ? "Testimonial updated" : "Testimonial added");
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleTestimonialAction(id, !current);
      if (result.success) {
        toast.success(current ? "Testimonial hidden" : "Testimonial published");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteTestimonialAction(deleteId);
      if (result.success) {
        toast.success("Testimonial deleted");
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(result.error);
        setDeleteId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>

      {/* Form (inline) */}
      {showForm && (
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">{editingItem ? "Edit" : "Add"} Testimonial</h3>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Customer Name *</label>
              <input type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} placeholder="Adil Khan" />
            </div>
            <div>
              <label className={labelClass}>What they said *</label>
              <textarea rows={3} required value={text} onChange={(e) => setText(e.target.value)} className={inputClass} placeholder="Got an iPhone 13 Pro in absolutely mint condition..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Display Order</label>
                <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className={inputClass} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                  <span className="text-sm font-medium text-foreground">Published</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingItem ? "Save Changes" : "Add"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {items.length === 0 && !showForm && (
        <div className={`${cardClass} text-center py-12`}>
          <MessageSquareQuote className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No testimonials yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add real customer feedback to build trust on your website.</p>
        </div>
      )}

      {/* List */}
      {visibleItems.map((item) => (
        <div key={item.id} className={`${cardClass} flex items-start justify-between gap-4`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                {item.customerName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.customerName}</p>
                <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider ${item.isPublished ? "text-emerald-500" : "text-muted-foreground"}`}>
                  {item.isPublished ? "Published" : "Draft"}
                  {item.sortOrder > 0 && <span className="ml-2 text-muted-foreground">#{item.sortOrder}</span>}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">&ldquo;{item.text}&rdquo;</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => handleToggle(item.id, item.isPublished)} disabled={isPending} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors" title={item.isPublished ? "Unpublish" : "Publish"}>
              {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors" title="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-destructive/70 hover:bg-destructive/10 transition-colors" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="rounded-xl border border-border/50 px-6 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            Show more ({items.length - visibleCount} remaining)
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Testimonial"
        description="This testimonial will be permanently removed. This cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
