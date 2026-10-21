import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedPost, renderArticleMarkdown } from '@/lib/blog';
import { SITE_URL, serializeJsonLd } from '@/lib/site';

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) {
    return { title: 'Article not found | Anil Anuragee' };
  }

  const canonical = post.canonicalUrl || `/blog/${post.slug}`;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;

  return {
    title: `${title} | Anil Anuragee`,
    description,
    keywords: post.keywords,
    alternates: { canonical },
    robots: {
      index: !post.noindex && !post.isSample,
      follow: true,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`,
      publishedTime: post.publishedAt,
      authors: ['Anil Anuragee'],
      tags: post.tags,
      ...(post.ogImage ? { images: [post.ogImage] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(post.ogImage ? { images: [post.ogImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  const articleHtml = await renderArticleMarkdown(post.contentMarkdown);
  const canonical = post.canonicalUrl || `${SITE_URL}/blog/${post.slug}`;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Person',
      name: 'Anil Anuragee',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Anil Anuragee',
    },
    mainEntityOfPage: canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`,
    keywords: post.keywords.join(', '),
    image: post.ogImage || undefined,
  };

  return (
    <main className="w blog-page article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleSchema) }} />
      <Link href="/blog" className="back-link">
        ← All articles
      </Link>
      <article>
        <header className="blog-header">
          <div className="blog-card-top">
            <span className="blog-category">{post.category}</span>
            {post.isSample && <span className="sample-badge">Sample article</span>}
          </div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="blog-meta">
            <span>By Anil Anuragee</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <span>{post.readTime}</span>
          </div>
        </header>
        {post.ogImage && (
          <Image
            className="article-cover"
            src={post.ogImage}
            alt={post.ogImageAlt || post.title}
            width={1200}
            height={630}
            unoptimized
          />
        )}
        <div className="article-content" dangerouslySetInnerHTML={{ __html: articleHtml }} />
        {post.isSample && (
          <p className="sample-disclaimer">
            This is demo content for the portfolio blog preview, not a published professional article.
          </p>
        )}
      </article>
    </main>
  );
}
