import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPublishedPosts();
  const hasIndexablePosts = posts.some((post) => !post.isSample && !post.noindex && !post.canonicalUrl);
  return {
    title: 'Engineering Blog | Anil Anuragee',
    description:
      'Engineering articles by Anil Anuragee about AI product engineering, full-stack development, and frontend workflows.',
    alternates: { canonical: '/blog' },
    robots: { index: hasIndexablePosts, follow: true },
    openGraph: {
      type: 'website',
      title: 'Engineering Blog | Anil Anuragee',
      description: 'Engineering articles by Anil Anuragee.',
      url: `${SITE_URL}/blog`,
    },
  };
}

export default async function BlogIndexPage() {
  const blogPosts = await getPublishedPosts();
  return (
    <main className="w blog-page">
      <Link href="/" className="back-link">
        ← Back to portfolio
      </Link>
      <header className="blog-header">
        <span className="eyebrow">ANIL ANURAGEE · ENGINEERING NOTES</span>
        <h1>Ideas from building for the web</h1>
        <p>
          Writing about AI product engineering, full-stack development, and frontend workflows.
        </p>
      </header>
      <div className="blog-list grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {blogPosts.map((post) => (
          <article key={post.slug} className="glass blog-card">
            <div className="blog-card-top">
              <span className="blog-category">{post.category}</span>
              {post.isSample && <span className="sample-badge">Sample</span>}
            </div>
            <h2>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="text-muted">{post.excerpt}</p>
            <div className="blog-meta">
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <span>{post.readTime}</span>
            </div>
            <div className="chip-row">
              {post.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
            <Link className="blog-read-more" href={`/blog/${post.slug}`}>
              Read article →
            </Link>
          </article>
        ))}
      </div>
      {blogPosts.some((post) => post.isSample) && (
        <p className="sample-disclaimer">
          These demo articles are not intended as final published work.
        </p>
      )}
    </main>
  );
}
