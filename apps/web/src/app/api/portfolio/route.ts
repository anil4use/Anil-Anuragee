import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@db';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { defaultPortfolioSections } from '@/lib/portfolio-defaults';
import { portfolioSaveSchema } from '@/lib/portfolio-schema';
import { mergePortfolioWithDefaults } from '@/lib/portfolio';
import seed from '../../../../../../seed/portfolio.json';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const stored = await (await getDatabase())
      .collection('portfolio')
      .findOne({ name: seed.site.name });
    if (!stored) {
      return NextResponse.json({ content: seed, sections: defaultPortfolioSections });
    }
    const content = Object.fromEntries(
      Object.entries(stored).filter(
        ([key]) => !['_id', 'name', 'seededAt', 'updatedAt', 'sectionSettings'].includes(key),
      ),
    );
    const sectionSettings = stored.sectionSettings;
    const sections = defaultPortfolioSections.map((base) => {
      const saved = Array.isArray(sectionSettings)
        ? (sectionSettings as typeof defaultPortfolioSections).find((item) => item.id === base.id)
        : undefined;
      return saved ? { ...base, enabled: saved.enabled, order: saved.order } : base;
    }).sort((left, right) => left.order - right.order);
    return NextResponse.json({ content: mergePortfolioWithDefaults(seed, content), sections });
  } catch (error) {
    console.error('Unable to load portfolio content:', error);
    return NextResponse.json({ error: 'Unable to load portfolio. Check MongoDB configuration.' }, { status: 503 });
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

  const parsed = portfolioSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Portfolio data is not valid.' },
      { status: 400 },
    );
  }
  if (parsed.data.content.site.name !== seed.site.name) {
    return NextResponse.json({ error: 'The portfolio owner name is a fixed database identifier.' }, { status: 400 });
  }

  try {
    const document = {
      ...parsed.data.content,
      name: seed.site.name,
      sectionSettings: [...parsed.data.sections].sort((a, b) => a.order - b.order),
      updatedAt: new Date().toISOString(),
    };
    await (await getDatabase())
      .collection('portfolio')
      .replaceOne({ name: seed.site.name }, document, { upsert: true });
    return NextResponse.json({ ok: true, updatedAt: document.updatedAt });
  } catch (error) {
    console.error('Unable to save portfolio content:', error);
    return NextResponse.json({ error: 'Unable to save portfolio. Check MongoDB configuration.' }, { status: 503 });
  }
}
