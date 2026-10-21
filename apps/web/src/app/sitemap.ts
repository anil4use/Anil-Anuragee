import type { MetadataRoute } from 'next';
import { getPublishedPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const indexablePosts = posts.filter(
    (post) => !post.isSample && !post.noindex && !post.canonicalUrl,
  );
  return [
    {
      url: SITE_URL,
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...(indexablePosts.length > 0
      ? [{
          url: `${SITE_URL}/blog`,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }]
      : []),
    ...indexablePosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt || post.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
  ];
}
