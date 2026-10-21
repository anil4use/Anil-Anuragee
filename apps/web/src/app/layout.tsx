import './globals.css';
import './admin/admin.css';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Anil Anuragee – AI-Native Full Stack Engineer',
  description: 'Portfolio and engineering blog for Anil Anuragee, AI-native full stack engineer.',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Anil Anuragee',
    title: 'Anil Anuragee – AI-Native Full Stack Engineer',
    description: 'Portfolio and engineering blog for Anil Anuragee, AI-native full stack engineer.',
    url: '/',
    images: [
      {
        url: '/images/anil-anuragee-full-stack-developer.jpg',
        alt: 'Anil Anuragee, AI-Native Full Stack Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anil Anuragee – AI-Native Full Stack Engineer',
    description: 'Portfolio and engineering blog for Anil Anuragee, AI-native full stack engineer.',
    images: ['/images/anil-anuragee-full-stack-developer.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
