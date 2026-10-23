import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import html from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import { getBlogPostsCollection } from '@db';
import samplePosts from '../../../../seed/blog-posts.json';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('html', html);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);

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
  const renderer = new marked.Renderer();
  let codeBlockId = 0;
  renderer.code = ({ text, lang }) => {
    const language = lang?.trim().split(/\s+/, 1)[0]?.toLowerCase() || '';
    const safeLanguage = /^[a-z0-9+#.-]{1,30}$/.test(language) ? language : '';
    const highlighted = safeLanguage && hljs.getLanguage(safeLanguage)
      ? hljs.highlight(text, { language: safeLanguage, ignoreIllegals: true }).value
      : text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
    const id = codeBlockId++;
    return `<div class="code-block"><div class="code-toolbar"><span>${safeLanguage || 'Code'}</span><button type="button" data-code-copy="${id}" aria-label="Copy code block">Copy code</button></div><pre><code class="hljs${safeLanguage ? ` language-${safeLanguage}` : ''}">${highlighted}</code></pre></div>`;
  };
  const parsed = await marked.parse(markdown, {
    async: true,
    gfm: true,
    breaks: false,
    renderer,
  });
  return sanitizeHtml(parsed, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'h3',
      'pre',
      'code',
      'span',
      'div',
      'button',
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class'],
      button: ['type', 'data-code-copy', 'aria-label'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
    },
  });
}
