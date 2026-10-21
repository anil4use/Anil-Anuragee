import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { getBlogPostsCollection } from '@db';
import samplePosts from '../../../../seed/blog-posts.json';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  keywords: string[];
  contentMarkdown: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogImageAlt?: string;
  noindex?: boolean;
  isSample: boolean;
};

export type BlogPostSummary = Omit<BlogPost, 'contentMarkdown'>;

type SamplePost = (typeof samplePosts)[number];

function sampleToPost(post: SamplePost): BlogPost {
  return {
    ...post,
    contentMarkdown: post.sections
      .map((section) => `## ${section.heading}\n\n${section.paragraphs.join('\n\n')}`)
      .join('\n\n'),
    isSample: true,
    noindex: true,
  };
}

export async function getPublishedPosts(limit?: number): Promise<BlogPostSummary[]> {
  if (typeof limit === 'number' && limit <= 0) return [];
  if (!process.env.MONGODB_URI) {
    const posts = samplePosts.map(sampleToPost);
    return typeof limit === 'number' ? posts.slice(0, limit) : posts;
  }

  const now = new Date().toISOString();
  const cursor = (await getBlogPostsCollection<BlogPostSummary>())
    .find(
      {
        status: { $in: ['published', 'scheduled'] },
        publishedAt: { $lte: now },
      },
      { projection: { _id: 0, contentMarkdown: 0 } },
    )
    .sort({ publishedAt: -1 });
  if (typeof limit === 'number') cursor.limit(limit);
  return cursor.toArray();
}

export async function getPublishedPost(slug: string): Promise<BlogPost | undefined> {
  if (!process.env.MONGODB_URI) {
    const sample = samplePosts.find((post) => post.slug === slug);
    return sample ? sampleToPost(sample) : undefined;
  }

  const now = new Date().toISOString();
  const post = await (await getBlogPostsCollection<BlogPost>()).findOne(
    {
      slug,
      status: { $in: ['published', 'scheduled'] },
      publishedAt: { $lte: now },
    },
    { projection: { _id: 0 } },
  );
  return post ?? undefined;
}

export async function renderArticleMarkdown(markdown: string): Promise<string> {
  const parsed = await marked.parse(markdown, { async: true, gfm: true, breaks: false });
  return sanitizeHtml(parsed, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
