import { supabase } from "@/lib/supabase";
import { Agent, Lead, Launch, WhatsAppTemplate } from "@/lib/types";

type DbLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  nationality: string | null;
  budget: number;
  property_type: Lead["propertyType"];
  area_preference: string;
  source: Lead["source"];
  status: Lead["status"];
  assigned_agent: string | null;
  notes: string | null;
  last_contacted: string | null;
  closings_value: number | null;
  created_at: string;
  campaign_name: string | null;
  ad_set: string | null;
  ad_name: string | null;
  platform: Lead["platform"] | null;
  timeline: string | null;
  language: string | null;
  utm_source: string | null;
  synced_at: string | null;
  first_response_at: string | null;
  ad_spend: number | null;
};

function fromDbLead(row: DbLead): Lead {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? "",
    nationality: row.nationality ?? "",
    budget: Number(row.budget),
    propertyType: row.property_type,
    areaPreference: row.area_preference,
    source: row.source,
    status: row.status,
    assignedAgent: row.assigned_agent ?? "",
    notes: row.notes ?? "",
    lastContacted: row.last_contacted ?? "",
    closingsValue: row.closings_value ? Number(row.closings_value) : undefined,
    createdAt: row.created_at.slice(0, 10),
    campaignName: row.campaign_name ?? "",
    adSet: row.ad_set ?? "",
    adName: row.ad_name ?? "",
    platform: row.platform ?? "Manual",
    timeline: row.timeline ?? "",
    language: row.language ?? "",
    utmSource: row.utm_source ?? "",
    syncedAt: row.synced_at ?? undefined,
    firstResponseAt: row.first_response_at ?? undefined,
    adSpend: row.ad_spend ? Number(row.ad_spend) : 0
  };
}

function toDbLead(lead: Lead, userId: string) {
  return {
    user_id: userId,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    nationality: lead.nationality,
    budget: lead.budget,
    property_type: lead.propertyType,
    area_preference: lead.areaPreference,
    source: lead.source,
    status: lead.status,
    assigned_agent: lead.assignedAgent,
    notes: lead.notes,
    last_contacted: lead.lastContacted || null,
    closings_value: lead.closingsValue ?? null,
    campaign_name: lead.campaignName ?? null,
    ad_set: lead.adSet ?? null,
    ad_name: lead.adName ?? null,
    platform: lead.platform ?? "Manual",
    timeline: lead.timeline ?? null,
    language: lead.language ?? null,
    utm_source: lead.utmSource ?? null,
    synced_at: lead.syncedAt ?? null,
    first_response_at: lead.firstResponseAt ?? null,
    ad_spend: lead.adSpend ?? 0
  };
}

export async function loadWorkspace(userId: string) {
  if (!supabase) return null;

  const [leadResult, agentResult, templateResult, launchResult] = await Promise.all([
    supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("agents").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("whatsapp_templates").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("offplan_launches").select("*").eq("user_id", userId).order("launch_date", { ascending: true })
  ]);

  if (leadResult.error) throw leadResult.error;
  if (agentResult.error) throw agentResult.error;
  if (templateResult.error) throw templateResult.error;
  if (launchResult.error) throw launchResult.error;

  return {
    leads: (leadResult.data as DbLead[]).map(fromDbLead),
    agents: agentResult.data.map((agent): Agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      phone: agent.phone ?? "",
      avatar: agent.avatar ?? agent.name.slice(0, 2).toUpperCase(),
      target: agent.monthly_target
    })),
    templates: templateResult.data.map((template): WhatsAppTemplate => ({
      id: template.id,
      name: template.name,
      body: template.body
    })),
    launches: launchResult.data.map((launch): Launch => ({
      id: launch.id,
      project: launch.project,
      developer: launch.developer,
      area: launch.area,
      launchDate: launch.launch_date,
      startingPrice: Number(launch.starting_price),
      inventory: launch.inventory ?? "",
      status: launch.status
    }))
  };
}

export async function createLead(userId: string, lead: Lead) {
  if (!supabase) return lead;
  const { data, error } = await supabase.from("leads").insert(toDbLead(lead, userId)).select("*").single();
  if (error) throw error;
  return fromDbLead(data as DbLead);
}

export async function saveLeadStatus(id: string, status: Lead["status"]) {
  if (!supabase) return;
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function saveLeadContacted(id: string, date: string, status: Lead["status"]) {
  if (!supabase) return;
  const { error } = await supabase.from("leads").update({ last_contacted: date, status }).eq("id", id);
  if (error) throw error;
}
