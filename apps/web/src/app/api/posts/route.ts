import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsCollection } from '@db';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { blogPostInput } from '@/lib/blog-schema';

export const runtime = 'nodejs';

function guard(request: NextRequest): NextResponse | null {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const posts = await (await getBlogPostsCollection())
      .find({}, { projection: { _id: 0, contentMarkdown: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Unable to load blog posts:', error);
    return NextResponse.json({ error: 'Unable to load posts. Check MongoDB configuration.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const denied = guard(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  const parsed = blogPostInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid post.' }, { status: 400 });
  }

  try {
    const collection = await getBlogPostsCollection();
    const existing = await collection.findOne({ slug: parsed.data.slug }, { projection: { _id: 1 } });
    if (existing) {
      return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const wordCount = parsed.data.contentMarkdown.trim().split(/\s+/).length;
    const post = {
      ...parsed.data,
      scheduledAt: parsed.data.status === 'scheduled' ? parsed.data.scheduledAt : null,
      seoTitle: parsed.data.seoTitle || parsed.data.title,
      seoDescription: parsed.data.seoDescription || parsed.data.excerpt,
      status: parsed.data.status,
      readTime: `${Math.max(1, Math.ceil(wordCount / 220))} min read`,
      createdAt: now,
      updatedAt: now,
      publishedAt:
        parsed.data.status === 'scheduled' ? parsed.data.scheduledAt : parsed.data.status === 'published' ? now : null,
      isSample: false,
    };

    await collection.insertOne(post);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Unable to create blog post:', error);
    return NextResponse.json({ error: 'Unable to save post. Check MongoDB configuration.' }, { status: 503 });
  }
}
