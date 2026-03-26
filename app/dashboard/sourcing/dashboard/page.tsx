import SourcingDashboardClient from '@/components/SourcingDashboardClient';

export const metadata = {
  title: "Sourcing Dashboard | CRM",
};

export default function SourcingDashboardPage() {
  return (
    <div>
      {/* 🪄 Data fetching ghay-wlli l-dakhel f l-Client Component */}
      <SourcingDashboardClient />
    </div>
  );
}