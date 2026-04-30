"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, MessageCircle, Paperclip } from "lucide-react";
import {
  createSupportAttachmentUrl,
  SupportAttachment,
  SupportMessage,
  SupportPriority,
  SupportProfile,
  SupportStatus,
  SupportTicket,
  addSupportMessage,
  canManageSupport,
  getSupportTicket,
  isSupportAdmin,
  listSupportStaff,
  requireSupportUser,
  supportPriorities,
  supportStatuses,
  updateSupportTicket,
  uploadSupportAttachments
} from "@/lib/support";

type StaffOption = {
  id: string;
  name: string;
  role: string;
};

export function SupportDetailPage({ ticketId }: { ticketId: string }) {
  const [profile, setProfile] = useState<SupportProfile | null>(null);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const nextProfile = await requireSupportUser();
        const [{ ticket: nextTicket, messages: nextMessages }, nextStaff] = await Promise.all([
          getSupportTicket(ticketId),
          listSupportStaff()
        ]);
        setProfile(nextProfile);
        setTicket(nextTicket);
        setMessages(nextMessages);
        setStaff(nextStaff);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load ticket.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketId]);

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || !ticket) return;
    setSaving(true);
    setError("");

    try {
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const body = String(form.get("body") ?? "");
      const isInternal = form.get("isInternal") === "on";
      const attachmentInput = formElement.elements.namedItem("attachments") as HTMLInputElement | null;
      const attachments = await uploadSupportAttachments(attachmentInput?.files ?? null, ticket.id);
      const message = await addSupportMessage({ ticketId: ticket.id, profile, body, isInternal, attachments });
      setMessages((current) => [...current, message]);
      setTicket({ ...ticket, updatedAt: new Date().toISOString() });
      formElement.reset();
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Unable to add reply.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTicketUpdate(patch: Parameters<typeof updateSupportTicket>[1]) {
    if (!ticket) return;
    setSaving(true);
    setError("");
    try {
      setTicket(await updateSupportTicket(ticket.id, patch));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update ticket.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="workspace support-workspace"><div className="support-empty">Loading ticket...</div></main>;
  if (error && !ticket) return <main className="workspace support-workspace"><div className="support-empty">{error}</div></main>;
  if (!ticket || !profile) return null;

  const canManage = canManageSupport(profile);
  const admin = isSupportAdmin(profile);

  return (
    <main className="workspace support-workspace">
      <Link className="secondary-action support-back" href="/dashboard/support"><ArrowLeft size={16} /> Back to tickets</Link>
      {error ? <div className="notice">{error}</div> : null}

      <section className="support-detail-grid">
        <section className="panel">
          <div className="ticket-title-row">
            <div>
              <span className="support-ticket-number">{ticket.ticketNumber}</span>
              <h1>{ticket.subject}</h1>
              <p>{ticket.companyName} - {ticket.category}</p>
            </div>
            <span className={`support-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
          </div>
          <p className="ticket-description">{ticket.description}</p>
          <AttachmentList attachments={ticket.attachments} />

          <div className="thread">
            {messages.map((message) => {
              if (message.isInternal && !admin) return null;
              return (
                <article className={message.isInternal ? "thread-message internal" : "thread-message"} key={message.id}>
                  <div>
                    <strong>{message.authorName}</strong>
                    {message.isInternal ? <span><Lock size={13} /> Internal note</span> : null}
                  </div>
                  <p>{message.body}</p>
                  <AttachmentList attachments={message.attachments} />
                  <small>{new Date(message.createdAt).toLocaleString()}</small>
                </article>
              );
            })}
          </div>

          <form className="reply-box" onSubmit={handleReply}>
            <label>Reply<textarea name="body" required rows={4} /></label>
            {admin ? <label className="inline-check"><input name="isInternal" type="checkbox" /> Internal private note</label> : null}
            <label>Attachments<input name="attachments" type="file" multiple /></label>
            <button className="primary-action" disabled={saving}><MessageCircle size={16} /> {saving ? "Saving..." : "Send Reply"}</button>
          </form>
        </section>

        <aside className="panel ticket-admin-panel">
          <div className="panel-heading"><h3>Ticket Controls</h3><CheckCircle2 size={18} /></div>
          <label>Status
            <select value={ticket.status} disabled={!canManage || saving} onChange={(event) => handleTicketUpdate({ status: event.target.value as SupportStatus })}>
              {supportStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={ticket.priority} disabled={!canManage || saving} onChange={(event) => handleTicketUpdate({ priority: event.target.value as SupportPriority })}>
              {supportPriorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </label>
          <label>Assign Staff
            <select value={ticket.assignedTo ?? ""} disabled={!admin || saving} onChange={(event) => {
              const next = staff.find((item) => item.id === event.target.value);
              handleTicketUpdate({ assigned_to: next?.id ?? null, assigned_to_name: next?.name ?? null });
            }}>
              <option value="">Unassigned</option>
              {staff.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.role})</option>)}
            </select>
          </label>
          <div className="detail-list">
            <p><strong>Status</strong>{ticket.status}</p>
            <p><strong>Assigned To</strong>{ticket.assignedToName}</p>
            <p><strong>Created</strong>{new Date(ticket.createdAt).toLocaleString()}</p>
            <p><strong>Updated</strong>{new Date(ticket.updatedAt).toLocaleString()}</p>
            <p><strong>Resolved</strong>{ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "Not resolved"}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function AttachmentList({ attachments }: { attachments: SupportAttachment[] }) {
  if (!attachments.length) return null;
  return (
    <div className="attachment-list">
      {attachments.map((attachment) => (
        <AttachmentLink attachment={attachment} key={attachment.path} />
      ))}
    </div>
  );
}

function AttachmentLink({ attachment }: { attachment: SupportAttachment }) {
  const [url, setUrl] = useState(attachment.url ?? "");

  useEffect(() => {
    if (url) return;
    createSupportAttachmentUrl(attachment.path)
      .then(setUrl)
      .catch(() => setUrl(""));
  }, [attachment.path, url]);

  return (
    <a href={url || "#"} target="_blank">
      <Paperclip size={14} /> {attachment.name}
    </a>
  );
}
