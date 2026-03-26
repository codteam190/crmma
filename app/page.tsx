import { redirect } from 'next/navigation';

export default function HomePage() {
  // Kay-lou7 l-User nichan l-Dashboard mnin kay-dkhl l-Domain
  redirect('/dashboard');
}