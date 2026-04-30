import { NextResponse } from "next/server";
import { ingestServerLead, verifyWebhook } from "@/lib/server-sync";

export async function POST(request: Request) {
  if (!verifyWebhook(request)) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const body = await request.json();
  const platform = body.platform === "whatsapp_click" ? "WhatsApp Click" as const : "Website Form" as const;
  const result = await ingestServerLead({
    userId: body.userId,
    name: body.name,
    phone: body.phone,
    email: body.email,
    campaignName: body.campaign_name ?? body.utm_campaign,
    adSet: body.utm_content,
    adName: body.form_name,
    platform,
    budget: body.budget,
    interestedArea: body.interested_area,
    propertyType: body.property_type,
    timeline: body.timeline,
    nationality: body.nationality,
    language: body.language,
    utmSource: body.utm_source ?? "website",
    notes: body.message,
    adSpend: body.ad_spend
  }, platform);

  return NextResponse.json({ ok: true, ...result });
}
