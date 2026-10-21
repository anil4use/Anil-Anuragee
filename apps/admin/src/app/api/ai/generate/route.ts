import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostsCollection, getDatabase } from '@db';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { resolveAiSettings } from '@/lib/ai-schema';
import { generateDraftBatch } from '@/lib/ai-generator';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  try {
    const db = await getDatabase();
    const stored = await db
      .collection<{ _id: string; [key: string]: unknown }>('ai_settings')
      .findOne({ _id: 'main' });
    const settings = resolveAiSettings(stored || {});
    const collection = await getBlogPostsCollection();
    const recent = await collection
      .find({ aiGenerated: true }, { projection: { title: 1, _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();
    const result = await generateDraftBatch(settings, collection, {
      recentTitles: recent.map((item) => String(item.title || '')),
    });
    return NextResponse.json({
      ok: true,
      count: result.count,
      sourceCount: result.sourceCount,
      drafts: result.drafts.map((draft) => ({
        slug: draft.slug,
        title: draft.title,
        category: draft.category,
        status: draft.status,
      })),
    });
  } catch (error) {
    console.error('AI draft generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI draft generation failed.' },
      { status: 503 },
    );
  }
}
