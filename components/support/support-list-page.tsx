"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, LifeBuoy, Plus, Search, Upload } from "lucide-react";
import {
  SupportPriority,
  SupportStatus,
  createSupportTicket,
  listSupportTickets,
  requireSupportUser,
  supportCategories,
  supportPriorities,
  supportStatuses,
  uploadSupportAttachments,
  type SupportCategory,
  type SupportProfile,
  type SupportTicket
} from "@/lib/support";

export function SupportListPage() {
  const [profile, setProfile] = useState<SupportProfile | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const nextProfile = await requireSupportUser();
        setProfile(nextProfile);
        setTickets(await listSupportTickets(nextProfile));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load support tickets.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const companies = useMemo(() => Array.from(new Set(tickets.map((ticket) => ticket.companyName))).filter(Boolean), [tickets]);
  const filteredTickets = useMemo(() => {
    const query = search.toLowerCase();
    return tickets.filter((ticket) => {
      const matchesSearch = [ticket.ticketNumber, ticket.companyName, ticket.subject, ticket.assignedToName].join(" ").toLowerCase().includes(query);
      return matchesSearch
        && (!statusFilter || ticket.status === statusFilter)
        && (!priorityFilter || ticket.priority === priorityFilter)
        && (!companyFilter || ticket.companyName === companyFilter);
    });
  }, [tickets, search, statusFilter, priorityFilter, companyFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setCreating(true);
    setError("");

    try {
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const attachmentInput = formElement.elements.namedItem("attachments") as HTMLInputElement | null;
      const attachments = await uploadSupportAttachments(attachmentInput?.files ?? null, `new-${profile.id}`);
      const ticket = await createSupportTicket({
        profile,
        subject: String(form.get("subject") ?? ""),
        description: String(form.get("description") ?? ""),
        category: String(form.get("category")) as SupportCategory,
        priority: String(form.get("priority")) as SupportPriority,
        attachments
      });
      setTickets((current) => [ticket, ...current]);
      formElement.reset();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create ticket.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <SupportShell><div className="support-empty">Loading support tickets...</div></SupportShell>;
  if (error && !profile) return <SupportShell><div className="support-empty">{error}</div></SupportShell>;

  return (
    <SupportShell>
      <section className="support-hero">
        <div>
          <div className="luxury-pill"><LifeBuoy size={15} /> Support center</div>
          <h1>Support Tickets</h1>
          <p>Create, track, assign, and resolve customer support conversations.</p>
        </div>
        <div className="support-hero-stat">
          <AlertTriangle size={18} />
          <strong>{tickets.filter((ticket) => ticket.priority === "Critical" && ticket.status !== "Closed").length}</strong>
          <span>Critical open</span>
        </div>
      </section>

      {error ? <div className="notice">{error}</div> : null}

      <section className="support-layout">
        <form className="panel support-form" onSubmit={handleCreate}>
          <div className="panel-heading"><h3>Create Ticket</h3><Plus size={18} /></div>
          <label>Subject<input name="subject" required maxLength={160} /></label>
          <label>Description<textarea name="description" required rows={5} /></label>
          <label>Category<select name="category">{supportCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Priority<select name="priority">{supportPriorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
          <label>Attachment upload<input name="attachments" type="file" multiple /></label>
          <button className="primary-action" disabled={creating}><Upload size={16} /> {creating ? "Creating..." : "Create Ticket"}</button>
        </form>

        <section className="panel support-table-panel">
          <div className="panel-heading"><h3>Ticket List</h3><Search size={18} /></div>
          <div className="support-filters">
            <input placeholder="Search tickets" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {supportStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="">All priorities</option>
              {supportPriorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
              <option value="">All companies</option>
              {companies.map((company) => <option key={company}>{company}</option>)}
            </select>
          </div>

          <div className="support-table">
            <div className="support-table-head">
              <span>Ticket ID</span><span>Company</span><span>Subject</span><span>Priority</span><span>Status</span><span>Assigned To</span><span>Created Date</span>
            </div>
            {filteredTickets.map((ticket) => (
              <Link className="support-row" href={`/dashboard/support/${ticket.id}`} key={ticket.id}>
                <span>{ticket.ticketNumber}</span>
                <span>{ticket.companyName}</span>
                <strong>{ticket.subject}</strong>
                <PriorityBadge priority={ticket.priority} />
                <span>{ticket.status}</span>
                <span>{ticket.assignedToName}</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </Link>
            ))}
            {!filteredTickets.length ? <div className="support-empty">No tickets match the current filters.</div> : null}
          </div>
        </section>
      </section>
    </SupportShell>
  );
}

function SupportShell({ children }: { children: ReactNode }) {
  return <main className="workspace support-workspace">{children}</main>;
}

function PriorityBadge({ priority }: { priority: SupportPriority }) {
  return <span className={`support-priority ${priority.toLowerCase()}`}>{priority}</span>;
}
