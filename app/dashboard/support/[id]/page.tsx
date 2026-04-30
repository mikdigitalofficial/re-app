import { SupportDetailPage } from "@/components/support/support-detail-page";

export default function SupportTicketPage({ params }: { params: { id: string } }) {
  return <SupportDetailPage ticketId={params.id} />;
}
