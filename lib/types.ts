export type LeadStatus =
  | "New Lead"
  | "Contacted"
  | "Viewing Booked"
  | "Negotiation"
  | "Closed Won"
  | "Lost";

export type PropertyType =
  | "Apartment"
  | "Villa"
  | "Townhouse"
  | "Penthouse"
  | "Plot"
  | "Commercial"
  | "Off-plan";

export type LeadSource =
  | "Meta Ads"
  | "Google Ads"
  | "Bayut"
  | "Property Finder"
  | "Dubizzle"
  | "WhatsApp"
  | "Referral"
  | "Website"
  | "Walk-in";

export type LeadPlatform =
  | "Facebook Instant Form"
  | "Instagram Lead Form"
  | "Google Lead Form"
  | "Website Form"
  | "WhatsApp Click"
  | "Bayut CSV"
  | "Property Finder CSV"
  | "Dubizzle CSV"
  | "Manual";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality: string;
  budget: number;
  propertyType: PropertyType;
  areaPreference: string;
  source: LeadSource;
  status: LeadStatus;
  assignedAgent: string;
  notes: string;
  lastContacted: string;
  createdAt: string;
  closingsValue?: number;
  campaignName?: string;
  adSet?: string;
  adName?: string;
  platform?: LeadPlatform;
  timeline?: string;
  language?: string;
  utmSource?: string;
  syncedAt?: string;
  firstResponseAt?: string;
  adSpend?: number;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  target: number;
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  body: string;
};

export type Launch = {
  id: string;
  project: string;
  developer: string;
  area: string;
  launchDate: string;
  startingPrice: number;
  inventory: string;
  status: "Teaser" | "EOI Open" | "Launched" | "Sold Out";
};

export type Branding = {
  companyName: string;
  tagline: string;
  primaryColor: string;
  whatsappNumber: string;
};

export type LeadSyncEvent = {
  id: string;
  platform: LeadPlatform;
  source: LeadSource;
  campaignName: string;
  leadName: string;
  assignedAgent: string;
  status: "Created" | "Alerted" | "Template Triggered" | "Failed";
  createdAt: string;
  hotScore: number;
};

export type CampaignPerformance = {
  id: string;
  platform: LeadPlatform;
  source: LeadSource;
  campaignName: string;
  adSet: string;
  spend: number;
  leads: number;
  closedWon: number;
  revenue: number;
};
