import { createClient } from "@supabase/supabase-js";
import { IncomingAdLead, sourceFromPlatform } from "@/lib/ads-sync";
import { LeadPlatform } from "@/lib/types";

export function verifyWebhook(request: Request) {
  const configuredSecret = process.env.LEAD_SYNC_WEBHOOK_SECRET;
  if (!configuredSecret) return true;
  return request.headers.get("x-lead-sync-secret") === configuredSecret;
}

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function ingestServerLead(input: IncomingAdLead & { userId?: string }, platform: LeadPlatform) {
  const supabase = getServiceClient();
  if (!supabase) {
    return { demo: true, lead: input };
  }

  if (!input.userId) {
    throw new Error("Missing userId for webhook lead ingestion.");
  }

  const source = sourceFromPlatform(platform);
  const leadInsert = {
    user_id: input.userId,
    name: input.name || "New synced lead",
    phone: input.phone || "",
    email: input.email || "",
    nationality: input.nationality || "",
    budget: Number(input.budget || 0),
    property_type: input.propertyType || "Apartment",
    area_preference: input.interestedArea || "Dubai",
    source,
    status: "New Lead",
    assigned_agent: null,
    notes: input.notes || `Auto-created from ${platform}.`,
    campaign_name: input.campaignName || "Untracked Campaign",
    ad_set: input.adSet || "Untracked Ad Set",
    ad_name: input.adName || "Untracked Ad",
    platform,
    timeline: input.timeline || "Not specified",
    language: input.language || "English",
    utm_source: input.utmSource || source,
    synced_at: new Date().toISOString(),
    ad_spend: input.adSpend ?? 0
  };

  const { data: lead, error } = await supabase.from("leads").insert(leadInsert).select("*").single();
  if (error) throw error;
  const hotScore = serverHotScore({
    budget: leadInsert.budget,
    source,
    platform,
    propertyType: leadInsert.property_type,
    timeline: leadInsert.timeline,
    campaignName: leadInsert.campaign_name
  });

  await supabase.from("leads").update({ hot_score: hotScore }).eq("id", lead.id);

  await supabase.from("lead_sync_events").insert({
    user_id: input.userId,
    lead_id: lead.id,
    platform,
    source,
    campaign_name: leadInsert.campaign_name,
    payload: input,
    assigned_agent: lead.assigned_agent,
    status: hotScore >= 75 ? "Alerted" : "Created",
    hot_score: hotScore
  });

  await supabase.from("notification_events").insert([
    {
      user_id: input.userId,
      lead_id: lead.id,
      alert_type: "instant_agent_notification",
      recipient: lead.assigned_agent,
      channel: "email",
      status: "Queued"
    },
    {
      user_id: input.userId,
      lead_id: lead.id,
      alert_type: "whatsapp_template_trigger",
      recipient: lead.phone,
      channel: "whatsapp",
      status: "Queued"
    }
  ]);

  return { demo: false, lead };
}

function serverHotScore(input: { budget: number; source: string; platform: string; propertyType: string; timeline: string; campaignName: string }) {
  let score = 25;
  if (input.budget >= 3000000) score += 25;
  else if (input.budget >= 1500000) score += 16;
  else if (input.budget >= 900000) score += 10;
  if (["Referral", "Property Finder", "Bayut", "Google Ads"].includes(input.source)) score += 10;
  if (["Off-plan", "Villa"].includes(input.propertyType)) score += 8;
  if (input.timeline === "0-30 days") score += 14;
  if (input.timeline === "30-60 days") score += 8;
  if (input.campaignName !== "Untracked Campaign") score += 5;
  if (input.platform === "WhatsApp Click") score += 10;
  return Math.max(0, Math.min(100, score));
}
