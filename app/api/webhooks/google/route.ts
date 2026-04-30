import { NextResponse } from "next/server";
import { ingestServerLead, verifyWebhook } from "@/lib/server-sync";

export async function POST(request: Request) {
  if (!verifyWebhook(request)) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const body = await request.json();
  const result = await ingestServerLead({
    userId: body.userId,
    name: body.name,
    phone: body.phone,
    email: body.email,
    campaignName: body.campaign_name,
    adSet: body.ad_group_name ?? body.adSet,
    adName: body.ad_name,
    platform: "Google Lead Form",
    budget: body.budget,
    interestedArea: body.interested_area,
    propertyType: body.property_type,
    timeline: body.timeline,
    nationality: body.nationality,
    language: body.language,
    utmSource: body.utm_source ?? "google",
    notes: body.notes,
    adSpend: body.ad_spend
  }, "Google Lead Form");

  return NextResponse.json({ ok: true, ...result });
}
