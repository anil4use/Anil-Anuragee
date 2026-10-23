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
      'Engineering articles by Anil Anuragee on AI engineering, MERN stack development, production bugs, security vulnerabilities, and emerging technology.',
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

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const blogPosts = await getPublishedPosts();
  const { category: requestedCategory } = await searchParams;
  const categoryQuery = Array.isArray(requestedCategory) ? requestedCategory[0] : requestedCategory;
  const categories = [...new Set(blogPosts.map((post) => post.category).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right),
  );
  const selectedCategory = categories.find(
    (category) => category.toLowerCase() === categoryQuery?.trim().toLowerCase(),
  );
  const visiblePosts = selectedCategory
    ? blogPosts.filter((post) => post.category === selectedCategory)
    : blogPosts;
  return (
    <main className="w blog-page">
      <Link href="/" className="back-link">
        ← Back to portfolio
      </Link>
      <header className="blog-header">
        <span className="eyebrow">ANIL ANURAGEE · ENGINEERING NOTES</span>
        <h1>AI, MERN & modern engineering</h1>
        <p>
          Practical notes on AI engineering, MERN stack, production bugs, security vulnerabilities,
          and new technologies.
        </p>
      </header>
      {categories.length > 0 && (
        <nav className="blog-category-filters" aria-label="Filter articles by category">
          <Link
            href="/blog"
            aria-current={!selectedCategory ? 'page' : undefined}
            className={!selectedCategory ? 'selected' : ''}
          >
            All topics
          </Link>
          {categories.map((item) => (
            <Link
              key={item}
              href={`/blog?category=${encodeURIComponent(item)}`}
              aria-current={selectedCategory === item ? 'page' : undefined}
              className={selectedCategory === item ? 'selected' : ''}
            >
              {item}
            </Link>
          ))}
        </nav>
      )}
      <div className="blog-list grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visiblePosts.map((post) => (
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
      {visiblePosts.length === 0 && (
        <p className="text-muted">No published articles in this topic yet. Check back soon.</p>
      )}
      {visiblePosts.some((post) => post.isSample) && (
        <p className="sample-disclaimer">
          These demo articles are not intended as final published work.
        </p>
      )}
    </main>
  );
}
