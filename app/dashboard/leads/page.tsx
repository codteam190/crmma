import LeadsClient from '@/components/LeadsClient';

export const metadata = {
  title: "Leads | CRM",
};

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <LeadsClient />
    </div>
  );
}