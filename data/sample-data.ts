import { Agent, Branding, Launch, Lead, WhatsAppTemplate } from "@/lib/types";

export const agents: Agent[] = [
  { id: "a1", name: "Maya Khan", role: "Off-plan Specialist", phone: "+971501112233", avatar: "MK", target: 6 },
  { id: "a2", name: "Omar Faris", role: "Luxury Broker", phone: "+971502224455", avatar: "OF", target: 5 },
  { id: "a3", name: "Leena Shah", role: "Investment Advisor", phone: "+971503336677", avatar: "LS", target: 7 },
  { id: "a4", name: "Adam Reed", role: "Leasing Lead", phone: "+971504448899", avatar: "AR", target: 4 }
];

export const initialLeads: Lead[] = [
  {
    id: "l1",
    name: "Rashid Al Nuaimi",
    phone: "+971551234567",
    email: "rashid@example.com",
    nationality: "UAE",
    budget: 4200000,
    propertyType: "Villa",
    areaPreference: "Dubai Hills Estate",
    source: "Property Finder",
    status: "Negotiation",
    assignedAgent: "Maya Khan",
    notes: "Cash buyer. Wants 4BR villa, family community, quick shortlist.",
    lastContacted: "2026-04-25",
    createdAt: "2026-04-18",
    closingsValue: 165000,
    campaignName: "Dubai Hills Villa Buyers Q2",
    adSet: "UAE Nationals High Intent",
    adName: "4BR Family Villa Carousel",
    platform: "Property Finder CSV",
    timeline: "0-30 days",
    language: "Arabic",
    utmSource: "property_finder",
    syncedAt: "2026-04-18T09:12:00+04:00",
    firstResponseAt: "2026-04-18T09:17:00+04:00",
    adSpend: 1200
  },
  {
    id: "l2",
    name: "Elena Petrova",
    phone: "+971589991010",
    email: "elena@example.com",
    nationality: "Russia",
    budget: 1850000,
    propertyType: "Off-plan",
    areaPreference: "Business Bay",
    source: "Meta Ads",
    status: "Viewing Booked",
    assignedAgent: "Leena Shah",
    notes: "Investor. Interested in payment plan and projected rental yield.",
    lastContacted: "2026-04-26",
    createdAt: "2026-04-22",
    campaignName: "Business Bay Off-plan Investors",
    adSet: "Russian Investors",
    adName: "Payment Plan Lead Form",
    platform: "Facebook Instant Form",
    timeline: "30-60 days",
    language: "English",
    utmSource: "facebook",
    syncedAt: "2026-04-22T14:22:00+04:00",
    firstResponseAt: "2026-04-22T14:27:00+04:00",
    adSpend: 430
  },
  {
    id: "l3",
    name: "Amit Mehta",
    phone: "+971526667788",
    email: "amit@example.com",
    nationality: "India",
    budget: 950000,
    propertyType: "Apartment",
    areaPreference: "JVC",
    source: "Google Ads",
    status: "Contacted",
    assignedAgent: "Omar Faris",
    notes: "First-time buyer. Needs mortgage estimate and ready options.",
    lastContacted: "2026-04-24",
    createdAt: "2026-04-21",
    campaignName: "JVC Ready Apartments Search",
    adSet: "Mortgage Buyers",
    adName: "Ready Apartment Extension",
    platform: "Google Lead Form",
    timeline: "60-90 days",
    language: "English",
    utmSource: "google",
    syncedAt: "2026-04-21T11:04:00+04:00",
    firstResponseAt: "2026-04-21T11:26:00+04:00",
    adSpend: 310
  },
  {
    id: "l4",
    name: "Fatima Hassan",
    phone: "+971507778899",
    email: "fatima@example.com",
    nationality: "Saudi Arabia",
    budget: 6800000,
    propertyType: "Penthouse",
    areaPreference: "Palm Jumeirah",
    source: "Referral",
    status: "New Lead",
    assignedAgent: "Omar Faris",
    notes: "Luxury buyer. Wants private viewing this week.",
    lastContacted: "",
    createdAt: "2026-04-26",
    campaignName: "Palm Luxury Penthouses",
    adSet: "GCC Luxury Buyers",
    adName: "Private Viewing WhatsApp",
    platform: "Instagram Lead Form",
    timeline: "0-30 days",
    language: "Arabic",
    utmSource: "instagram",
    syncedAt: "2026-04-26T10:01:00+04:00",
    adSpend: 620
  },
  {
    id: "l5",
    name: "Chen Wei",
    phone: "+971565551122",
    email: "chen@example.com",
    nationality: "China",
    budget: 2400000,
    propertyType: "Off-plan",
    areaPreference: "Dubai Creek Harbour",
    source: "Website",
    status: "Closed Won",
    assignedAgent: "Leena Shah",
    notes: "Closed on 2BR launch unit. Send post-sale referral request.",
    lastContacted: "2026-04-23",
    createdAt: "2026-04-05",
    closingsValue: 96000,
    campaignName: "Creek Harbour Launch",
    adSet: "China Investors",
    adName: "Handover 2028 Lead Form",
    platform: "Website Form",
    timeline: "90+ days",
    language: "English",
    utmSource: "landing_page",
    syncedAt: "2026-04-05T16:35:00+04:00",
    firstResponseAt: "2026-04-05T16:41:00+04:00",
    adSpend: 540
  },
  {
    id: "l6",
    name: "James Walker",
    phone: "+971544449900",
    email: "james@example.com",
    nationality: "United Kingdom",
    budget: 1350000,
    propertyType: "Apartment",
    areaPreference: "Dubai Marina",
    source: "Bayut",
    status: "Lost",
    assignedAgent: "Adam Reed",
    notes: "Bought with another agency. Re-engage in 90 days for referrals.",
    lastContacted: "2026-04-19",
    createdAt: "2026-04-10",
    campaignName: "Marina Apartment Leads",
    adSet: "UK Expats",
    adName: "Bayut Listing Inquiry",
    platform: "Bayut CSV",
    timeline: "0-30 days",
    language: "English",
    utmSource: "bayut",
    syncedAt: "2026-04-10T18:10:00+04:00",
    firstResponseAt: "2026-04-10T19:02:00+04:00",
    adSpend: 280
  }
];

export const templates: WhatsAppTemplate[] = [
  {
    id: "new-inquiry",
    name: "New inquiry",
    body: "Hi {{name}}, thanks for your inquiry. I have noted your {{propertyType}} requirement in {{areaPreference}} with a budget of AED {{budget}}. I can send you the best matching options now."
  },
  {
    id: "viewing-reminder",
    name: "Viewing reminder",
    body: "Hi {{name}}, quick reminder for your viewing. I will share the location and available timing. Please confirm if WhatsApp is the best way to coordinate."
  },
  {
    id: "price-drop",
    name: "Price drop alert",
    body: "Hi {{name}}, a strong option in {{areaPreference}} just had a price update. It fits your AED {{budget}} range and may move quickly. Shall I send details?"
  },
  {
    id: "re-engagement",
    name: "Re-engagement",
    body: "Hi {{name}}, checking in. Are you still exploring {{propertyType}} options in Dubai? I can send a fresh shortlist based on today's market."
  }
];

export const launches: Launch[] = [
  {
    id: "p1",
    project: "Aurelia Residences",
    developer: "Emaar",
    area: "Dubai Hills Estate",
    launchDate: "2026-05-03",
    startingPrice: 1650000,
    inventory: "1-3BR Apartments",
    status: "EOI Open"
  },
  {
    id: "p2",
    project: "Marina Crown Collection",
    developer: "Select Group",
    area: "Dubai Marina",
    launchDate: "2026-05-12",
    startingPrice: 2200000,
    inventory: "2BR, 3BR, Penthouses",
    status: "Teaser"
  },
  {
    id: "p3",
    project: "Creek Horizon Villas",
    developer: "Sobha",
    area: "Dubai Creek Harbour",
    launchDate: "2026-04-20",
    startingPrice: 3900000,
    inventory: "Townhouses, Villas",
    status: "Launched"
  }
];

export const defaultBranding: Branding = {
  companyName: "PROJECT_NAME",
  tagline: "Capture, nurture, and close Dubai property leads faster.",
  primaryColor: "#d8b766",
  whatsappNumber: "+971500000000"
};
