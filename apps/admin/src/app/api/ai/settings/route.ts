import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@db';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { aiSettingsSchema, resolveAiSettings } from '@/lib/ai-schema';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  try {
    const stored = await (await getDatabase())
      .collection<{ _id: string; [key: string]: unknown }>('ai_settings')
      .findOne({ _id: 'main' });
    const settings = Object.fromEntries(
      Object.entries(stored || {}).filter(([key]) => !['_id', 'updatedAt'].includes(key)),
    );
    const schedulerStatus = Object.fromEntries(
      [
        'lastRunStatus',
        'lastRunDate',
        'lastRunStartedAt',
        'lastRunCompletedAt',
        'lastRunCount',
        'lastRunError',
        'lastPublishStatus',
        'lastPublishRunAt',
        'lastPublishCount',
      ].flatMap((key) => (key in (stored || {}) ? [[key, stored?.[key]]] : [])),
    );
    return NextResponse.json({ settings: { ...resolveAiSettings(settings), ...schedulerStatus } });
  } catch (error) {
    console.error('Unable to load AI writing settings:', error);
    return NextResponse.json({ error: 'Unable to load AI settings. Check MongoDB configuration.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  const parsed = aiSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid AI configuration.' },
      { status: 400 },
    );
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: parsed.data.timezone }).format(new Date());
  } catch {
    return NextResponse.json({ error: 'Choose a valid IANA time zone.' }, { status: 400 });
  }

  try {
    await (await getDatabase()).collection<{ _id: string; [key: string]: unknown }>('ai_settings').updateOne(
      { _id: 'main' },
      { $set: { ...parsed.data, updatedAt: new Date().toISOString() } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unable to save AI writing settings:', error);
    return NextResponse.json({ error: 'Unable to save AI settings. Check MongoDB configuration.' }, { status: 503 });
  }
}
