import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsCollection } from '@db';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { blogPostInput } from '@/lib/blog-schema';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const post = await (await getBlogPostsCollection()).findOne(
      { slug },
      { projection: { _id: 0 } },
    );
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Unable to load blog post:', error);
    return NextResponse.json({ error: 'Unable to load post. Check MongoDB configuration.' }, { status: 503 });
  }
}

function guard(request: NextRequest): NextResponse | null {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }
  return null;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    const { slug } = await params;
    const collection = await getBlogPostsCollection();
    const duplicate = await collection.findOne(
      { $and: [{ slug: parsed.data.slug }, { slug: { $ne: slug } }] },
      { projection: { _id: 1 } },
    );
    if (duplicate) {
      return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 });
    }

    const current = await collection.findOne({ slug });
    if (!current) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

    const now = new Date().toISOString();
    const wordCount = parsed.data.contentMarkdown.trim().split(/\s+/).length;
    const post = {
      ...parsed.data,
      scheduledAt: parsed.data.status === 'scheduled' ? parsed.data.scheduledAt : null,
      seoTitle: parsed.data.seoTitle || parsed.data.title,
      seoDescription: parsed.data.seoDescription || parsed.data.excerpt,
      readTime: `${Math.max(1, Math.ceil(wordCount / 220))} min read`,
      createdAt: current.createdAt || now,
      updatedAt: now,
      publishedAt:
        parsed.data.status === 'scheduled'
          ? parsed.data.scheduledAt
          : parsed.data.status === 'published'
          ? current.status === 'published' && current.publishedAt
            ? current.publishedAt
            : now
          : null,
      isSample: false,
    };

    await collection.replaceOne({ slug }, post);
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Unable to update blog post:', error);
    return NextResponse.json({ error: 'Unable to update post. Check MongoDB configuration.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const { slug } = await params;
    const result = await (await getBlogPostsCollection()).deleteOne({ slug });
    if (!result.deletedCount) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unable to delete blog post:', error);
    return NextResponse.json({ error: 'Unable to delete post. Check MongoDB configuration.' }, { status: 503 });
  }
}
