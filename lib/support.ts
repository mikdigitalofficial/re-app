import { supabase } from "@/lib/supabase";

export type SupportCategory =
  | "Technical Issue"
  | "Lead Sync Problem"
  | "Billing"
  | "User Access"
  | "Complaint"
  | "Feature Request"
  | "General Support";

export type SupportPriority = "Low" | "Medium" | "High" | "Critical";
export type SupportStatus = "Open" | "In Progress" | "Waiting Client" | "Resolved" | "Closed";
export type SupportRole = "owner" | "admin" | "staff" | "user" | "agent";

export type SupportProfile = {
  id: string;
  companyName: string;
  fullName: string;
  role: SupportRole;
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  companyName: string;
  companyId: string | null;
  createdBy: string;
  createdByName: string;
  assignedTo: string | null;
  assignedToName: string;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  attachments: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  attachments: SupportAttachment[];
  createdAt: string;
};

export type SupportAttachment = {
  name: string;
  path: string;
  url?: string;
  size?: number;
};

export const supportCategories: SupportCategory[] = [
  "Technical Issue",
  "Lead Sync Problem",
  "Billing",
  "User Access",
  "Complaint",
  "Feature Request",
  "General Support"
];

export const supportPriorities: SupportPriority[] = ["Low", "Medium", "High", "Critical"];
export const supportStatuses: SupportStatus[] = ["Open", "In Progress", "Waiting Client", "Resolved", "Closed"];

type TicketRow = {
  id: string;
  ticket_number: string;
  company_name: string;
  company_id: string | null;
  created_by: string;
  created_by_name: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  attachments: SupportAttachment[] | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  attachments: SupportAttachment[] | null;
  created_at: string;
};

function mapTicket(row: TicketRow): SupportTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    companyName: row.company_name,
    companyId: row.company_id,
    createdBy: row.created_by,
    createdByName: row.created_by_name ?? "User",
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name ?? "Unassigned",
    subject: row.subject,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    attachments: row.attachments ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at
  };
}

function mapMessage(row: MessageRow): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName: row.author_name ?? "User",
    body: row.body,
    isInternal: row.is_internal,
    attachments: row.attachments ?? [],
    createdAt: row.created_at
  };
}

export function canManageSupport(profile: SupportProfile | null) {
  return profile?.role === "admin" || profile?.role === "owner" || profile?.role === "staff";
}

export function isSupportAdmin(profile: SupportProfile | null) {
  return profile?.role === "admin" || profile?.role === "owner";
}

export async function requireSupportUser() {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in to continue.");

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_name, full_name, role")
    .eq("id", authData.user.id)
    .single();

  if (profileError) throw profileError;

  return {
    id: authData.user.id,
    companyName: profileRow.company_name ?? "",
    fullName: profileRow.full_name ?? authData.user.email ?? "User",
    role: profileRow.role ?? "user"
  } as SupportProfile;
}

export async function listSupportTickets(profile: SupportProfile) {
  if (!supabase) return [];

  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("updated_at", { ascending: false });

  if (profile.role === "staff") query = query.eq("assigned_to", profile.id);
  if (!isSupportAdmin(profile) && profile.role !== "staff") query = query.eq("company_name", profile.companyName);

  const { data, error } = await query;
  if (error) throw error;
  return (data as TicketRow[]).map(mapTicket);
}

export async function getSupportTicket(id: string) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const [{ data: ticket, error: ticketError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase.from("support_tickets").select("*").eq("id", id).single(),
    supabase.from("support_messages").select("*").eq("ticket_id", id).order("created_at", { ascending: true })
  ]);

  if (ticketError) throw ticketError;
  if (messagesError) throw messagesError;

  return {
    ticket: mapTicket(ticket as TicketRow),
    messages: (messages as MessageRow[]).map(mapMessage)
  };
}

export async function createSupportTicket(input: {
  profile: SupportProfile;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  attachments: SupportAttachment[];
}) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      company_name: input.profile.companyName,
      created_by: input.profile.id,
      created_by_name: input.profile.fullName,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
      attachments: input.attachments
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapTicket(data as TicketRow);
}

export async function addSupportMessage(input: {
  ticketId: string;
  profile: SupportProfile;
  body: string;
  isInternal: boolean;
  attachments: SupportAttachment[];
}) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: input.ticketId,
      author_id: input.profile.id,
      author_name: input.profile.fullName,
      body: input.body,
      is_internal: input.isInternal,
      attachments: input.attachments
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMessage(data as MessageRow);
}

export async function updateSupportTicket(id: string, patch: Partial<{
  status: SupportStatus;
  priority: SupportPriority;
  assigned_to: string | null;
  assigned_to_name: string | null;
}>) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const update: Record<string, string | null> = {};
  if (patch.status) {
    update.status = patch.status;
    if (patch.status === "Resolved") update.resolved_at = new Date().toISOString();
    if (patch.status !== "Resolved") update.resolved_at = null;
  }
  if (patch.priority) update.priority = patch.priority;
  if ("assigned_to" in patch) update.assigned_to = patch.assigned_to ?? null;
  if ("assigned_to_name" in patch) update.assigned_to_name = patch.assigned_to_name ?? null;

  const { data, error } = await supabase
    .from("support_tickets")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapTicket(data as TicketRow);
}

export async function listSupportStaff() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "owner", "staff"])
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id as string,
    name: (row.full_name as string | null) ?? "Staff",
    role: row.role as string
  }));
}

export async function uploadSupportAttachments(files: FileList | null, ticketScope: string) {
  if (!supabase || !files?.length) return [];

  const uploads = Array.from(files).map(async (file) => {
    const path = `${ticketScope}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file);
    if (error) throw error;
    return { name: file.name, path, size: file.size } satisfies SupportAttachment;
  });

  return Promise.all(uploads);
}

export async function createSupportAttachmentUrl(path: string) {
  if (!supabase) return "";
  const { data, error } = await supabase.storage.from("support-attachments").createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
