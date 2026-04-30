import { Lead, WhatsAppTemplate } from "@/lib/types";

export function renderTemplate(template: WhatsAppTemplate, lead: Lead) {
  return template.body
    .replaceAll("{{name}}", lead.name)
    .replaceAll("{{propertyType}}", lead.propertyType)
    .replaceAll("{{areaPreference}}", lead.areaPreference)
    .replaceAll("{{budget}}", lead.budget.toLocaleString("en-AE"));
}

export function createWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
