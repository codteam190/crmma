import TeamClient from '@/components/TeamClient';

export const metadata = {
  title: 'Team Management | ECOMLB',
  description: 'Manage your CRM team and access permissions.',
};

export default function TeamPage() {
  return (
    // 🪄 L-Client Component howa li ghay-kfel b l-bzaq
    <TeamClient />
  );
}