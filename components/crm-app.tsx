"use client";

import Link from "next/link";
import {
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gem,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageCircle,
  MoonStar,
  PieChart,
  Plus,
  Settings,
  Sparkles,
  Upload,
  Users,
  Wand2
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { agents as sampleAgents, defaultBranding, initialLeads, launches, templates as sampleTemplates } from "@/data/sample-data";
import { campaignPerformance, createSyncEvent, csvRowsToIncomingLeads, normalizeIncomingLead } from "@/lib/ads-sync";
import { createLead, loadWorkspace, saveLeadContacted, saveLeadStatus } from "@/lib/database";
import { calculateHotLeadScore, scoreLabel } from "@/lib/scoring";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { Agent, Branding, Lead, LeadPlatform, LeadSource, LeadStatus, LeadSyncEvent, PropertyType, WhatsAppTemplate } from "@/lib/types";
import { createWhatsAppUrl, renderTemplate } from "@/lib/whatsapp";

const stages: LeadStatus[] = ["New Lead", "Contacted", "Viewing Booked", "Negotiation", "Closed Won", "Lost"];
const sources: LeadSource[] = ["Meta Ads", "Google Ads", "Bayut", "Property Finder", "Dubizzle", "WhatsApp", "Referral", "Website", "Walk-in"];
const propertyTypes: PropertyType[] = ["Apartment", "Villa", "Townhouse", "Penthouse", "Plot", "Commercial", "Off-plan"];
const areas = ["Dubai Hills Estate", "Business Bay", "Palm Jumeirah", "JVC", "Dubai Marina", "Downtown Dubai", "Dubai Creek Harbour", "Emaar Beachfront"];

const nav = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "leads", label: "Lead CRM", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: BarChart3 },
  { id: "sync", label: "Ads Lead Sync", icon: BellRing },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "assistant", label: "AI Assistant", icon: Wand2 },
  { id: "launches", label: "Off-plan Launches", icon: Building2 },
  { id: "reports", label: "Reports", icon: PieChart },
  { id: "settings", label: "Settings", icon: Settings }
];

type View = (typeof nav)[number]["id"];

const emptyLead = {
  name: "",
  phone: "",
  email: "",
  nationality: "",
  budget: 1500000,
  propertyType: "Apartment" as PropertyType,
  areaPreference: "Dubai Marina",
  source: "Meta Ads" as LeadSource,
  status: "New Lead" as LeadStatus,
  assignedAgent: "Maya Khan",
  notes: "",
  lastContacted: "",
  campaignName: "",
  adSet: "",
  adName: "",
  platform: "Manual" as LeadPlatform,
  timeline: "",
  language: "English",
  utmSource: ""
};

const demoIncomingLead = {
  name: "Noura Al Mansouri",
  phone: "+971558887766",
  email: "noura@example.com",
  campaignName: "Palm Luxury Penthouses",
  adSet: "GCC Luxury Buyers",
  adName: "Sea View Lead Form",
  platform: "Instagram Lead Form" as LeadPlatform,
  budget: 7200000,
  interestedArea: "Palm Jumeirah",
  propertyType: "Penthouse",
  timeline: "0-30 days",
  nationality: "UAE",
  language: "Arabic",
  utmSource: "instagram",
  adSpend: 185
};

export function CrmApp() {
  const [user, setUser] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [agents, setAgents] = useState<Agent[]>(sampleAgents);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(sampleTemplates);
  const [trackedLaunches, setTrackedLaunches] = useState(launches);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [leadDraft, setLeadDraft] = useState(emptyLead);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(sampleTemplates[0].id);
  const [aiMode, setAiMode] = useState("Follow-up message");
  const [aiOutput, setAiOutput] = useState("");
  const [syncEvents, setSyncEvents] = useState<LeadSyncEvent[]>(initialLeads.filter((lead) => lead.platform).map(createSyncEvent));
  const [portalPlatform, setPortalPlatform] = useState<LeadPlatform>("Bayut CSV");

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0];

  const metrics = useMemo(() => {
    const won = leads.filter((lead) => lead.status === "Closed Won");
    const hot = leads.filter((lead) => calculateHotLeadScore(lead) >= 75);
    const conversion = leads.length ? Math.round((won.length / leads.length) * 100) : 0;
    const monthlyClosings = won.reduce((sum, lead) => sum + (lead.closingsValue ?? Math.round(lead.budget * 0.04)), 0);
    return { total: leads.length, hot: hot.length, conversion, monthlyClosings };
  }, [leads]);
  const campaignStats = useMemo(() => campaignPerformance(leads), [leads]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (supabase) {
      const result =
        authMode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        setAuthMessage(result.error.message);
      } else {
        const nextUserId = result.data.user?.id ?? "";
        setUserId(nextUserId);
        setUser(email);
        setAuthMessage(authMode === "signup" ? "Check your email to confirm your account." : "");
        if (nextUserId) {
          const workspace = await loadWorkspace(nextUserId);
          if (workspace) {
            if (workspace.leads.length) setLeads(workspace.leads);
            if (workspace.agents.length) setAgents(workspace.agents);
            if (workspace.templates.length) setTemplates(workspace.templates);
            if (workspace.launches.length) setTrackedLaunches(workspace.launches);
          }
        }
      }
    } else {
      setUser(email || "demo@dubairecrm.com");
    }
    setAuthLoading(false);
  }

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lead: Lead = {
      ...leadDraft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString().slice(0, 10)
    };
    const savedLead = userId && supabase ? await createLead(userId, lead) : lead;
    setLeads((current) => [savedLead, ...current]);
    setSelectedLeadId(savedLead.id);
    setLeadDraft(emptyLead);
  }

  async function addSyncedLead(platform: LeadPlatform = demoIncomingLead.platform) {
    const lead = normalizeIncomingLead({ ...demoIncomingLead, platform }, agents, leads.length);
    const savedLead = userId && supabase ? await createLead(userId, lead) : lead;
    setLeads((current) => [savedLead, ...current]);
    setSyncEvents((current) => [createSyncEvent(savedLead), ...current]);
    setSelectedLeadId(savedLead.id);
  }

  async function importPortalCsv(file: File) {
    const csv = await file.text();
    const incoming = csvRowsToIncomingLeads(csv, portalPlatform);
    const newLeads = incoming.map((item, index) => normalizeIncomingLead(item, agents, leads.length + index));
    setLeads((current) => [...newLeads, ...current]);
    setSyncEvents((current) => [...newLeads.map(createSyncEvent), ...current]);
  }

  async function updateLeadStatus(id: string, status: LeadStatus) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
    if (supabase) await saveLeadStatus(id, status);
  }

  async function updateLeadContacted(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    const lead = leads.find((item) => item.id === id);
    const status = lead?.status === "New Lead" ? "Contacted" : lead?.status ?? "Contacted";
    setLeads((current) => current.map((item) => (item.id === id ? { ...item, lastContacted: today, status } : item)));
    if (supabase) await saveLeadContacted(id, today, status);
  }

  function exportCsv() {
    const header = ["Name", "Phone", "Email", "Nationality", "Budget", "Property Type", "Area", "Source", "Campaign", "Ad Set", "Ad Name", "Platform", "Timeline", "Language", "UTM Source", "Status", "Assigned Agent", "Notes", "Last Contacted", "Hot Score"];
    const rows = leads.map((lead) => [
      lead.name,
      lead.phone,
      lead.email,
      lead.nationality,
      lead.budget,
      lead.propertyType,
      lead.areaPreference,
      lead.source,
      lead.campaignName ?? "",
      lead.adSet ?? "",
      lead.adName ?? "",
      lead.platform ?? "",
      lead.timeline ?? "",
      lead.language ?? "",
      lead.utmSource ?? "",
      lead.status,
      lead.assignedAgent,
      lead.notes,
      lead.lastContacted,
      calculateHotLeadScore(lead)
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-name-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function generateAiText() {
    if (!selectedLead) return;
    const score = calculateHotLeadScore(selectedLead);
    const outputs: Record<string, string> = {
      "Follow-up message": `Hi ${selectedLead.name}, I shortlisted a few ${selectedLead.propertyType.toLowerCase()} options in ${selectedLead.areaPreference} that match your AED ${selectedLead.budget.toLocaleString("en-AE")} budget. Would you prefer ready units or off-plan payment plans?`,
      "Property pitch": `${selectedLead.areaPreference} is a strong match for ${selectedLead.name}'s requirement: premium community demand, Dubai lifestyle appeal, and options within AED ${selectedLead.budget.toLocaleString("en-AE")}. Lead with ROI, payment flexibility, and availability.`,
      "Investor message": `Hi ${selectedLead.name}, based on your budget, I can share Dubai options with attractive payment plans and rental demand. I would focus on ${selectedLead.areaPreference} and compare expected yield, handover timeline, and resale upside.`,
      "Objection reply": `That makes sense, ${selectedLead.name}. Before you decide, let me compare two options: one with the lowest entry price and one with stronger long-term value. This way you can see the trade-off clearly before moving forward.`
    };
    setAiOutput(`${outputs[aiMode]}\n\nHot Lead Score: ${score}/100 (${scoreLabel(score)})`);
  }

  if (!user) {
    return (
      <main className="auth-screen">
        <section className="auth-hero">
          <div className="luxury-pill"><MoonStar size={16} /> Dubai broker operating system</div>
          <h1>PROJECT_NAME</h1>
          <p>Capture, nurture, and close property leads faster with pipeline CRM, WhatsApp automation, AI scripts, and off-plan launch tracking.</p>
          <div className="auth-stats">
            <span><strong>24/7</strong> lead follow-up</span>
            <span><strong>100</strong> hot score</span>
            <span><strong>AED</strong> pipeline view</span>
          </div>
        </section>

        <form className="auth-card" onSubmit={handleAuth}>
          <Gem className="gold-icon" />
          <h2>{authMode === "login" ? "Broker Login" : "Create Agency Account"}</h2>
          <p>{hasSupabaseConfig ? "Use your Supabase email auth." : "Demo mode is active until Supabase keys are added."}</p>
          <label>Email<input name="email" type="email" placeholder="agent@agency.ae" required /></label>
          <label>Password<input name="password" type="password" placeholder="Minimum 6 characters" required /></label>
          {authMessage ? <div className="notice">{authMessage}</div> : null}
          <button className="primary-action" disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Sign up"}</button>
          <button className="text-action" type="button" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
            {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">DR</div>
          <div>
            <h1>{branding.companyName}</h1>
            <p>{branding.tagline}</p>
          </div>
        </div>
        <nav className="nav-list">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activeView === item.id ? "active" : ""} onClick={() => setActiveView(item.id)}>
                <Icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
        <Link className="support-sidebar-link" href="/dashboard/support"><LifeBuoy size={16} /> Support</Link>
        <button className="logout" onClick={() => { setUser(null); setUserId(""); }}><LogOut size={16} /> Logout</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="luxury-pill"><Sparkles size={15} /> Premium Dubai SaaS</div>
            <h2>{nav.find((item) => item.id === activeView)?.label}</h2>
          </div>
          <div className="topbar-actions">
            <button className="secondary-action" onClick={exportCsv}><Upload size={16} /> Export CSV</button>
            <button className="primary-action" onClick={() => setActiveView("leads")}><Plus size={16} /> Add Lead</button>
          </div>
        </header>

        {activeView === "dashboard" && (
          <section className="view-grid">
            <Metric title="Total leads" value={metrics.total} detail="Active agency database" />
            <Metric title="Hot leads" value={metrics.hot} detail="Score 75+" tone="hot" />
            <Metric title="Conversion" value={`${metrics.conversion}%`} detail="Closed won / total leads" />
            <Metric title="Monthly closings" value={`AED ${metrics.monthlyClosings.toLocaleString("en-AE")}`} detail="Commission value" />

            <Panel className="span-2" title="Source Performance">
              <BarList data={sourcePerformance(leads)} />
            </Panel>
            <Panel title="Agent Performance">
              <AgentPerformance leads={leads} agents={agents} />
            </Panel>
            <Panel title="Hot Lead Watchlist">
              <div className="stack">
                {leads
                  .slice()
                  .sort((a, b) => calculateHotLeadScore(b) - calculateHotLeadScore(a))
                  .slice(0, 4)
                  .map((lead) => <LeadMini key={lead.id} lead={lead} />)}
              </div>
            </Panel>
            <Panel className="span-2" title="Ads Lead Sync Performance">
              <div className="insight-grid">
                <Insight label="Best campaign" value={bestCampaign(campaignStats)?.campaignName ?? "No campaign"} detail={`${bestCampaign(campaignStats)?.closedWon ?? 0} closings`} />
                <Insight label="Worst campaign" value={worstCampaign(campaignStats)?.campaignName ?? "No campaign"} detail="Lowest close rate with spend" />
                <Insight label="Avg speed to lead" value={`${averageResponseMinutes(leads)} min`} detail="First response from synced time" />
                <Insight label="Top ROI source" value={topRoiCampaign(campaignStats)?.source ?? "No source"} detail={`${Math.round((topRoiCampaign(campaignStats)?.revenue ?? 0) / Math.max(topRoiCampaign(campaignStats)?.spend ?? 1, 1))}x ROI`} />
              </div>
            </Panel>
          </section>
        )}

        {activeView === "leads" && (
          <section className="two-column">
            <Panel title="Add Property Lead">
              <form className="form-grid" onSubmit={addLead}>
                <Input label="Name" value={leadDraft.name} onChange={(value) => setLeadDraft({ ...leadDraft, name: value })} required />
                <Input label="Phone" value={leadDraft.phone} onChange={(value) => setLeadDraft({ ...leadDraft, phone: value })} required />
                <Input label="Email" value={leadDraft.email} onChange={(value) => setLeadDraft({ ...leadDraft, email: value })} />
                <Input label="Nationality" value={leadDraft.nationality} onChange={(value) => setLeadDraft({ ...leadDraft, nationality: value })} />
                <Input label="Budget AED" type="number" value={leadDraft.budget} onChange={(value) => setLeadDraft({ ...leadDraft, budget: Number(value) })} />
                <Select label="Property Type" value={leadDraft.propertyType} options={propertyTypes} onChange={(value) => setLeadDraft({ ...leadDraft, propertyType: value as PropertyType })} />
                <Select label="Area Preference" value={leadDraft.areaPreference} options={areas} onChange={(value) => setLeadDraft({ ...leadDraft, areaPreference: value })} />
                <Select label="Source" value={leadDraft.source} options={sources} onChange={(value) => setLeadDraft({ ...leadDraft, source: value as LeadSource })} />
                <Select label="Status" value={leadDraft.status} options={stages} onChange={(value) => setLeadDraft({ ...leadDraft, status: value as LeadStatus })} />
                <Select label="Assigned Agent" value={leadDraft.assignedAgent} options={agents.map((agent) => agent.name)} onChange={(value) => setLeadDraft({ ...leadDraft, assignedAgent: value })} />
                <Input label="Last Contacted" type="date" value={leadDraft.lastContacted} onChange={(value) => setLeadDraft({ ...leadDraft, lastContacted: value })} />
                <Input label="Campaign Name" value={leadDraft.campaignName} onChange={(value) => setLeadDraft({ ...leadDraft, campaignName: value })} />
                <Input label="Ad Set" value={leadDraft.adSet} onChange={(value) => setLeadDraft({ ...leadDraft, adSet: value })} />
                <Input label="Ad Name" value={leadDraft.adName} onChange={(value) => setLeadDraft({ ...leadDraft, adName: value })} />
                <Select label="Platform" value={leadDraft.platform} options={platformOptions} onChange={(value) => setLeadDraft({ ...leadDraft, platform: value as LeadPlatform })} />
                <Input label="Timeline" value={leadDraft.timeline} onChange={(value) => setLeadDraft({ ...leadDraft, timeline: value })} />
                <Input label="Language" value={leadDraft.language} onChange={(value) => setLeadDraft({ ...leadDraft, language: value })} />
                <Input label="UTM Source" value={leadDraft.utmSource} onChange={(value) => setLeadDraft({ ...leadDraft, utmSource: value })} />
                <label className="full">Notes<textarea value={leadDraft.notes} onChange={(event) => setLeadDraft({ ...leadDraft, notes: event.target.value })} /></label>
                <button className="primary-action full">Save Lead</button>
              </form>
            </Panel>
            <Panel title="Lead Database">
              <div className="lead-table">
                {leads.map((lead) => (
                  <button key={lead.id} className="lead-row" onClick={() => setSelectedLeadId(lead.id)}>
                    <span><strong>{lead.name}</strong><small>{lead.areaPreference} - {lead.propertyType}</small></span>
                    <span>{lead.assignedAgent}</span>
                    <StatusBadge status={lead.status} />
                    <HotScore score={calculateHotLeadScore(lead)} />
                  </button>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === "sync" && (
          <section className="view-grid">
            <Metric title="Synced leads" value={syncEvents.length} detail="Meta, Google, portals, forms" />
            <Metric title="Hot synced leads" value={syncEvents.filter((event) => event.hotScore >= 75).length} detail="Priority tag triggered" tone="hot" />
            <Metric title="No-reply alerts" value={leads.filter((lead) => needsTenMinuteAlert(lead)).length} detail="Agent alert after 10 min" />
            <Metric title="Manager alerts" value={leads.filter((lead) => needsManagerAlert(lead)).length} detail="No update after 24h" />

            <Panel className="span-2" title="Live Ad Lead Intake">
              <div className="sync-connectors">
                {platformOptions.filter((platform) => platform !== "Manual").map((platform) => (
                  <button className="connector-card" key={platform} onClick={() => addSyncedLead(platform)}>
                    <BellRing size={18} />
                    <strong>{platform}</strong>
                    <span>Webhook ready</span>
                  </button>
                ))}
              </div>
              <div className="button-row">
                <button className="primary-action" onClick={() => addSyncedLead("Facebook Instant Form")}>Simulate Meta Lead</button>
                <button className="secondary-action" onClick={() => addSyncedLead("Google Lead Form")}>Simulate Google Lead</button>
              </div>
            </Panel>

            <Panel title="Portal CSV Import">
              <div className="form-grid single">
                <Select label="Portal" value={portalPlatform} options={["Bayut CSV", "Property Finder CSV", "Dubizzle CSV"]} onChange={(value) => setPortalPlatform(value as LeadPlatform)} />
                <label>Upload CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) importPortalCsv(file); }} /></label>
              </div>
              <p className="muted-copy">CSV headers can include name, phone, email, campaign, ad set, ad name, budget, area, property type, timeline, nationality, language, UTM source, and notes.</p>
            </Panel>

            <Panel title="Automation Rules">
              <div className="timeline">
                <article><BellRing size={18} /><div><strong>10-minute alert</strong><p>If no first response after sync, notify assigned agent instantly.</p></div></article>
                <article><Users size={18} /><div><strong>24-hour manager alert</strong><p>If status or notes are not updated, escalate to manager.</p></div></article>
                <article><Flame size={18} /><div><strong>Hot lead priority</strong><p>Score 75+ applies priority tag and pushes WhatsApp template.</p></div></article>
                <article><MessageCircle size={18} /><div><strong>Template trigger</strong><p>New inquiry template is prepared for one-click WhatsApp send.</p></div></article>
              </div>
            </Panel>

            <Panel className="span-2" title="Campaign ROI">
              <CampaignTable campaigns={campaignStats} />
            </Panel>
            <Panel className="span-2" title="Sync Event Log">
              <div className="lead-table">
                {syncEvents.map((event) => (
                  <div className="lead-row static-row" key={event.id}>
                    <span><strong>{event.leadName}</strong><small>{event.platform} - {event.campaignName}</small></span>
                    <span>{event.assignedAgent}</span>
                    <span className="status-badge">{event.status}</span>
                    <HotScore score={event.hotScore} />
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === "pipeline" && (
          <section className="kanban">
            {stages.map((stage) => (
              <div className="kanban-column" key={stage}>
                <h3>{stage}</h3>
                {leads.filter((lead) => lead.status === stage).map((lead) => (
                  <article className="deal-card" key={lead.id}>
                    <div className="deal-head">
                      <strong>{lead.name}</strong>
                      <HotScore score={calculateHotLeadScore(lead)} />
                    </div>
                    <p>{lead.propertyType} in {lead.areaPreference}</p>
                    <p>AED {lead.budget.toLocaleString("en-AE")}</p>
                    <select value={lead.status} onChange={(event) => updateLeadStatus(lead.id, event.target.value as LeadStatus)}>
                      {stages.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </article>
                ))}
              </div>
            ))}
          </section>
        )}

        {activeView === "whatsapp" && selectedLead && selectedTemplate && (
          <section className="two-column">
            <Panel title="One-click WhatsApp Automation">
              <div className="form-grid">
                <Select label="Lead" value={selectedLead.id} options={leads.map((lead) => lead.id)} optionLabels={Object.fromEntries(leads.map((lead) => [lead.id, lead.name]))} onChange={setSelectedLeadId} />
                <Select label="Template" value={selectedTemplateId} options={templates.map((template) => template.id)} optionLabels={Object.fromEntries(templates.map((template) => [template.id, template.name]))} onChange={setSelectedTemplateId} />
              </div>
              <div className="message-preview">{renderTemplate(selectedTemplate, selectedLead)}</div>
              <div className="button-row">
                <a className="primary-action" href={createWhatsAppUrl(selectedLead.phone, renderTemplate(selectedTemplate, selectedLead))} target="_blank">Open WhatsApp</a>
                <button className="secondary-action" onClick={() => updateLeadContacted(selectedLead.id)}><CheckCircle2 size={16} /> Mark Contacted</button>
              </div>
            </Panel>
            <Panel title="Follow-up Reminders">
              <div className="timeline">
                {leads.filter((lead) => lead.status !== "Closed Won" && lead.status !== "Lost").slice(0, 5).map((lead, index) => (
                  <article key={lead.id}>
                    <CalendarClock size={18} />
                    <div><strong>{lead.name}</strong><p>{index === 0 ? "Today" : `In ${index + 1} days`} - send {lead.status === "Viewing Booked" ? "viewing reminder" : "follow-up message"}</p></div>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === "assistant" && selectedLead && (
          <section className="two-column">
            <Panel title="AI Sales Assistant">
              <div className="form-grid">
                <Select label="Lead" value={selectedLead.id} options={leads.map((lead) => lead.id)} optionLabels={Object.fromEntries(leads.map((lead) => [lead.id, lead.name]))} onChange={setSelectedLeadId} />
                <Select label="Generate" value={aiMode} options={["Follow-up message", "Property pitch", "Investor message", "Objection reply"]} onChange={setAiMode} />
              </div>
              <button className="primary-action" onClick={generateAiText}><Sparkles size={16} /> Generate</button>
              {aiOutput ? <div className="message-preview">{aiOutput}</div> : null}
            </Panel>
            <Panel title="Lead Intelligence">
              <LeadDetail lead={selectedLead} />
            </Panel>
          </section>
        )}

        {activeView === "launches" && (
          <section className="view-grid">
            {trackedLaunches.map((launch) => (
              <article className="launch-card" key={launch.id}>
                <span className="status-pill">{launch.status}</span>
                <h3>{launch.project}</h3>
                <p>{launch.developer} - {launch.area}</p>
                <div className="launch-meta">
                  <span>Launch {launch.launchDate}</span>
                  <span>From AED {launch.startingPrice.toLocaleString("en-AE")}</span>
                  <span>{launch.inventory}</span>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeView === "reports" && (
          <section className="two-column">
            <Panel title="Daily / Monthly Report">
              <div className="report-card">
                <h3>April 2026 Agency Report</h3>
                <p>Total leads: {metrics.total}</p>
                <p>Hot leads: {metrics.hot}</p>
                <p>Conversion: {metrics.conversion}%</p>
                <p>Closed commission value: AED {metrics.monthlyClosings.toLocaleString("en-AE")}</p>
                <button className="primary-action" onClick={exportCsv}>Export Lead CSV</button>
              </div>
            </Panel>
            <Panel title="Monthly Closings">
              <BarList data={agents.map((agent) => ({ label: agent.name, value: leads.filter((lead) => lead.assignedAgent === agent.name && lead.status === "Closed Won").length, total: agent.target }))} />
            </Panel>
          </section>
        )}

        {activeView === "settings" && (
          <section className="two-column">
            <Panel title="Company Branding">
              <div className="form-grid">
                <Input label="Company Name" value={branding.companyName} onChange={(value) => setBranding({ ...branding, companyName: value })} />
                <Input label="Tagline" value={branding.tagline} onChange={(value) => setBranding({ ...branding, tagline: value })} />
                <Input label="Gold Accent" type="color" value={branding.primaryColor} onChange={(value) => setBranding({ ...branding, primaryColor: value })} />
                <Input label="WhatsApp Number" value={branding.whatsappNumber} onChange={(value) => setBranding({ ...branding, whatsappNumber: value })} />
              </div>
            </Panel>
            <Panel title="Agents & Templates">
              <div className="stack">
                {agents.map((agent) => <AgentPill key={agent.id} agent={agent} />)}
                {templates.map((template) => <TemplateEditor key={template.id} template={template} onChange={(next) => setTemplates((current) => current.map((item) => (item.id === next.id ? next : item)))} />)}
              </div>
            </Panel>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ title, value, detail, tone }: { title: string; value: string | number; detail: string; tone?: string }) {
  return (
    <article className={`metric-card ${tone ?? ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function Panel({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h3>{title}</h3>
        <ChevronRight size={18} />
      </div>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label>{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label>{label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`status-badge ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function HotScore({ score }: { score: number }) {
  return <span className="hot-score"><Flame size={14} /> {score}</span>;
}

function LeadMini({ lead }: { lead: Lead }) {
  const score = calculateHotLeadScore(lead);
  return (
    <article className="mini-card">
      <div><strong>{lead.name}</strong><p>{lead.areaPreference} - AED {lead.budget.toLocaleString("en-AE")}</p></div>
      <HotScore score={score} />
    </article>
  );
}

function LeadDetail({ lead }: { lead: Lead }) {
  return (
    <div className="detail-list">
      <p><strong>Phone</strong>{lead.phone}</p>
      <p><strong>Email</strong>{lead.email}</p>
      <p><strong>Nationality</strong>{lead.nationality}</p>
      <p><strong>Requirement</strong>{lead.propertyType} in {lead.areaPreference}</p>
      <p><strong>Budget</strong>AED {lead.budget.toLocaleString("en-AE")}</p>
      <p><strong>Campaign</strong>{lead.campaignName ?? "Manual lead"}</p>
      <p><strong>Platform</strong>{lead.platform ?? "Manual"}</p>
      <p><strong>Timeline</strong>{lead.timeline ?? "Not set"}</p>
      <p><strong>Notes</strong>{lead.notes}</p>
    </div>
  );
}

function AgentPill({ agent }: { agent: Agent }) {
  return (
    <div className="agent-pill">
      <span>{agent.avatar}</span>
      <div><strong>{agent.name}</strong><p>{agent.role} - target {agent.target}/mo</p></div>
    </div>
  );
}

function TemplateEditor({ template, onChange }: { template: WhatsAppTemplate; onChange: (template: WhatsAppTemplate) => void }) {
  return (
    <label>{template.name}
      <textarea value={template.body} onChange={(event) => onChange({ ...template, body: event.target.value })} />
    </label>
  );
}

function AgentPerformance({ leads, agents }: { leads: Lead[]; agents: Agent[] }) {
  return (
    <div className="stack">
      {agents.map((agent) => {
        const owned = leads.filter((lead) => lead.assignedAgent === agent.name);
        const won = owned.filter((lead) => lead.status === "Closed Won").length;
        return <div className="agent-line" key={agent.id}><AgentPill agent={agent} /><span>{won}/{agent.target} closed</span></div>;
      })}
    </div>
  );
}

function BarList({ data }: { data: { label: string; value: number; total?: number }[] }) {
  const max = Math.max(...data.map((item) => item.total ?? item.value), 1);
  return (
    <div className="bar-list">
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <span>{item.label}</span>
          <div><i style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} /></div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function sourcePerformance(leads: Lead[]) {
  return sources.map((source) => ({ label: source, value: leads.filter((lead) => lead.source === source).length })).filter((item) => item.value > 0);
}

const platformOptions: LeadPlatform[] = ["Facebook Instant Form", "Instagram Lead Form", "Google Lead Form", "Website Form", "WhatsApp Click", "Bayut CSV", "Property Finder CSV", "Dubizzle CSV", "Manual"];

function Insight({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="insight-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function CampaignTable({ campaigns }: { campaigns: ReturnType<typeof campaignPerformance> }) {
  return (
    <div className="campaign-table">
      <div className="campaign-head"><span>Campaign</span><span>CPL</span><span>Close rate</span><span>ROI</span></div>
      {campaigns.map((campaign) => {
        const cpl = campaign.spend / Math.max(campaign.leads, 1);
        const closeRate = Math.round((campaign.closedWon / Math.max(campaign.leads, 1)) * 100);
        const roi = campaign.revenue / Math.max(campaign.spend, 1);
        return (
          <div className="campaign-row" key={campaign.id}>
            <span><strong>{campaign.campaignName}</strong><small>{campaign.source} - {campaign.adSet}</small></span>
            <span>AED {Math.round(cpl).toLocaleString("en-AE")}</span>
            <span>{closeRate}%</span>
            <span>{roi.toFixed(1)}x</span>
          </div>
        );
      })}
    </div>
  );
}

function bestCampaign(campaigns: ReturnType<typeof campaignPerformance>) {
  return campaigns.slice().sort((a, b) => b.closedWon - a.closedWon || b.leads - a.leads)[0];
}

function worstCampaign(campaigns: ReturnType<typeof campaignPerformance>) {
  return campaigns.filter((item) => item.spend > 0).slice().sort((a, b) => (a.closedWon / Math.max(a.leads, 1)) - (b.closedWon / Math.max(b.leads, 1)))[0];
}

function topRoiCampaign(campaigns: ReturnType<typeof campaignPerformance>) {
  return campaigns.slice().sort((a, b) => (b.revenue / Math.max(b.spend, 1)) - (a.revenue / Math.max(a.spend, 1)))[0];
}

function averageResponseMinutes(leads: Lead[]) {
  const responseTimes = leads
    .filter((lead) => lead.syncedAt && lead.firstResponseAt)
    .map((lead) => (new Date(lead.firstResponseAt as string).getTime() - new Date(lead.syncedAt as string).getTime()) / 60000);
  if (!responseTimes.length) return 0;
  return Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length);
}

function needsTenMinuteAlert(lead: Lead) {
  if (!lead.syncedAt || lead.firstResponseAt || lead.status !== "New Lead") return false;
  return Date.now() - new Date(lead.syncedAt).getTime() > 10 * 60 * 1000;
}

function needsManagerAlert(lead: Lead) {
  if (!lead.syncedAt || lead.status !== "New Lead") return false;
  return Date.now() - new Date(lead.syncedAt).getTime() > 24 * 60 * 60 * 1000;
}
