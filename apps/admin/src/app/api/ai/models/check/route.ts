import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { checkProviderModel } from '@/lib/ai-generator';

export const runtime = 'nodejs';

const modelCheckSchema = z.object({
  provider: z.enum(['groq', 'gemini', 'openrouter']),
  model: z.string().trim().min(2).max(120),
});

export async function POST(request: NextRequest) {
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

  const parsed = modelCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid model settings.' }, { status: 400 });
  }

  try {
    const available = await checkProviderModel(parsed.data.provider, parsed.data.model);
    return NextResponse.json({
      available,
      message: available
        ? `${parsed.data.model} is listed by ${parsed.data.provider}.`
        : `${parsed.data.model} was not found in the ${parsed.data.provider} model catalog. Check the model ID and provider.`,
    });
  } catch (error) {
    console.error('Unable to check AI provider model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to check provider model.' },
      { status: 503 },
    );
  }
}
