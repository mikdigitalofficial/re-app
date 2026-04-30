import { Lead } from "@/lib/types";

export function calculateHotLeadScore(lead: Lead) {
  let score = 25;

  if (lead.budget >= 3000000) score += 25;
  else if (lead.budget >= 1500000) score += 16;
  else if (lead.budget >= 900000) score += 10;

  if (["Viewing Booked", "Negotiation"].includes(lead.status)) score += 24;
  if (lead.status === "New Lead") score += 8;
  if (lead.source === "Referral") score += 14;
  if (["Property Finder", "Bayut", "Google Ads"].includes(lead.source)) score += 10;
  if (lead.propertyType === "Off-plan" || lead.propertyType === "Villa") score += 8;
  if (lead.timeline === "0-30 days") score += 14;
  if (lead.timeline === "30-60 days") score += 8;
  if (lead.campaignName && lead.campaignName !== "Untracked Campaign") score += 5;
  if (lead.platform === "WhatsApp Click") score += 10;
  if (!lead.lastContacted) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number) {
  if (score >= 75) return "Hot";
  if (score >= 50) return "Warm";
  return "Cold";
}
