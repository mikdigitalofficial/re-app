import { Agent, CampaignPerformance, Lead, LeadPlatform, LeadSource, LeadSyncEvent, PropertyType } from "@/lib/types";
import { calculateHotLeadScore } from "@/lib/scoring";

export type IncomingAdLead = {
  name?: string;
  phone?: string;
  email?: string;
  campaignName?: string;
  adSet?: string;
  adName?: string;
  platform?: LeadPlatform;
  budget?: number | string;
  interestedArea?: string;
  propertyType?: PropertyType | string;
  timeline?: string;
  nationality?: string;
  language?: string;
  utmSource?: string;
  notes?: string;
  adSpend?: number;
};

export function sourceFromPlatform(platform: LeadPlatform): LeadSource {
  if (platform === "Facebook Instant Form" || platform === "Instagram Lead Form") return "Meta Ads";
  if (platform === "Google Lead Form") return "Google Ads";
  if (platform === "Bayut CSV") return "Bayut";
  if (platform === "Property Finder CSV") return "Property Finder";
  if (platform === "Dubizzle CSV") return "Dubizzle";
  if (platform === "WhatsApp Click") return "WhatsApp";
  return "Website";
}

export function assignAgent(agents: Agent[], leadCount: number) {
  return agents[leadCount % Math.max(agents.length, 1)]?.name ?? "Unassigned";
}

export function normalizeIncomingLead(input: IncomingAdLead, agents: Agent[], leadCount: number): Lead {
  const platform = input.platform ?? "Website Form";
  const today = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: input.name || "New synced lead",
    phone: input.phone || "",
    email: input.email || "",
    nationality: input.nationality || "",
    budget: Number(input.budget || 0),
    propertyType: normalizePropertyType(input.propertyType),
    areaPreference: input.interestedArea || "Dubai",
    source: sourceFromPlatform(platform),
    status: "New Lead",
    assignedAgent: assignAgent(agents, leadCount),
    notes: input.notes || `Auto-created from ${platform}.`,
    lastContacted: "",
    createdAt: today.slice(0, 10),
    campaignName: input.campaignName || "Untracked Campaign",
    adSet: input.adSet || "Untracked Ad Set",
    adName: input.adName || "Untracked Ad",
    platform,
    timeline: input.timeline || "Not specified",
    language: input.language || "English",
    utmSource: input.utmSource || sourceFromPlatform(platform),
    syncedAt: today,
    adSpend: input.adSpend ?? 0
  };
}

function normalizePropertyType(value?: PropertyType | string): PropertyType {
  const allowed: PropertyType[] = ["Apartment", "Villa", "Townhouse", "Penthouse", "Plot", "Commercial", "Off-plan"];
  return allowed.includes(value as PropertyType) ? value as PropertyType : "Apartment";
}

export function createSyncEvent(lead: Lead): LeadSyncEvent {
  return {
    id: crypto.randomUUID(),
    platform: lead.platform ?? "Manual",
    source: lead.source,
    campaignName: lead.campaignName ?? "Untracked Campaign",
    leadName: lead.name,
    assignedAgent: lead.assignedAgent,
    status: calculateHotLeadScore(lead) >= 75 ? "Alerted" : "Created",
    createdAt: lead.syncedAt ?? new Date().toISOString(),
    hotScore: calculateHotLeadScore(lead)
  };
}

export function campaignPerformance(leads: Lead[]): CampaignPerformance[] {
  const map = new Map<string, CampaignPerformance>();
  leads.forEach((lead) => {
    const key = `${lead.source}-${lead.campaignName ?? "Untracked Campaign"}-${lead.adSet ?? "Untracked Ad Set"}`;
    const current = map.get(key) ?? {
      id: key,
      platform: lead.platform ?? "Manual",
      source: lead.source,
      campaignName: lead.campaignName ?? "Untracked Campaign",
      adSet: lead.adSet ?? "Untracked Ad Set",
      spend: 0,
      leads: 0,
      closedWon: 0,
      revenue: 0
    };
    current.spend += lead.adSpend ?? 0;
    current.leads += 1;
    if (lead.status === "Closed Won") {
      current.closedWon += 1;
      current.revenue += lead.closingsValue ?? Math.round(lead.budget * 0.04);
    }
    map.set(key, current);
  });
  return Array.from(map.values()).sort((a, b) => b.leads - a.leads);
}

export function csvRowsToIncomingLeads(csv: string, platform: LeadPlatform): IncomingAdLead[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const get = (...names: string[]) => {
      const index = headers.findIndex((header) => names.includes(header));
      return index >= 0 ? cells[index] : "";
    };
    return {
      platform,
      name: get("name", "full name", "lead name", "contact name"),
      phone: get("phone", "mobile", "phone number", "contact number"),
      email: get("email", "email address"),
      campaignName: get("campaign", "campaign name"),
      adSet: get("ad set", "adset", "ad group"),
      adName: get("ad", "ad name"),
      budget: get("budget", "price", "max budget"),
      interestedArea: get("area", "interested area", "location", "community"),
      propertyType: get("property type", "type"),
      timeline: get("timeline", "buying timeline"),
      nationality: get("nationality"),
      language: get("language"),
      utmSource: get("utm_source", "utm source", "source"),
      notes: get("notes", "message", "comments")
    };
  });
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, "").replaceAll('""', '"'));
}
