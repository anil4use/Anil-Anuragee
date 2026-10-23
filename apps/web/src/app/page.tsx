import { PortfolioHome } from '@/components/PortfolioHome';
import type { Metadata } from 'next';
import { SITE_URL, serializeJsonLd } from '@/lib/site';
import { getPublishedPosts } from '@/lib/blog';
import { defaultPortfolioSections, getPortfolioContent } from '@/lib/portfolio';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Anil Anuragee | AI-Native Full Stack Engineer in Indore',
  description:
    'Anil Anuragee is an AI-native full stack engineer in Indore, India, building production web applications and AI-powered products with React, TypeScript, Node.js, and MySQL.',
  alternates: {
    canonical: '/',
  },
};

export default async function Page() {
  const { content, sections } = await getPortfolioContent();
  const latestPosts = await getPublishedPosts(3);
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: content.site.name,
    jobTitle: content.site.tagline,
    description: content.site.summary,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Indore',
      addressCountry: 'IN',
    },
    url: SITE_URL,
    sameAs: [content.site.linkedin, content.site.github].filter(Boolean),
    knowsAbout: [
      'React',
      'Next.js',
      'TypeScript',
      'Node.js',
      'MySQL',
      'AI engineering',
      'MERN stack development',
      'Application security',
      'Production debugging',
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(personSchema) }} />
      <PortfolioHome
        portfolioData={content}
        latestPosts={latestPosts}
        sectionSettings={sections.length ? sections : defaultPortfolioSections}
      />
    </>
  );
}
