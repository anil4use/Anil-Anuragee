import type { Metadata } from 'next';
import { AdminPortal } from '@/components/AdminPortal';

export const metadata: Metadata = {
  title: 'Admin dashboard | Anil Anuragee',
  alternates: { canonical: '/anil_a' },
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="admin-root">
      <AdminPortal />
    </div>
  );
}
