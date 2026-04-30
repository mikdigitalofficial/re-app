import { NextResponse } from "next/server";
import { ingestServerLead, verifyWebhook } from "@/lib/server-sync";

export async function POST(request: Request) {
  if (!verifyWebhook(request)) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const body = await request.json();
  const lead = {
    userId: body.userId,
    name: body.full_name ?? body.name,
    phone: body.phone_number ?? body.phone,
    email: body.email,
    campaignName: body.campaign_name,
    adSet: body.adset_name ?? body.ad_set,
    adName: body.ad_name,
    platform: body.platform === "instagram" ? "Instagram Lead Form" as const : "Facebook Instant Form" as const,
    budget: body.budget,
    interestedArea: body.interested_area ?? body.area,
    propertyType: body.property_type,
    timeline: body.timeline,
    nationality: body.nationality,
    language: body.language,
    utmSource: "meta",
    notes: body.notes,
    adSpend: body.ad_spend
  };

  const result = await ingestServerLead(lead, lead.platform);
  return NextResponse.json({ ok: true, ...result });
}
