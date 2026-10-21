import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getDatabase } from '@db';
import {
  isAllowedOrigin,
  setAdminSession,
  verifyAdminCredentials,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

async function isRateLimited(request: NextRequest): Promise<boolean> {
  const address =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const key = createHash('sha256').update(address).digest('hex');
  const collection = (await getDatabase()).collection<{
    _id: string;
    windowStart: Date;
    count: number;
    expiresAt: Date;
  }>('admin_login_attempts');
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'login_attempt_ttl' });
  const now = new Date();
  const cutoff = new Date(now.getTime() - 15 * 60 * 1000);
  const result = await collection.findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          windowStart: {
            $cond: [{ $gt: ['$windowStart', cutoff] }, '$windowStart', now],
          },
          count: {
            $cond: [{ $gt: ['$windowStart', cutoff] }, { $add: ['$count', 1] }, 1],
          },
          expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
        },
      },
    ],
    { upsert: true, returnDocument: 'after' },
  );
  return Boolean(result && result.count > 5);
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email and password.' }, { status: 400 });
  }

  try {
    if (await isRateLimited(request)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Wait 15 minutes and try again.' },
        { status: 429 },
      );
    }
    if (!verifyAdminCredentials(parsed.data.email, parsed.data.password)) {
      return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    setAdminSession(response, parsed.data.email.trim().toLowerCase());
    return response;
  } catch (error) {
    console.error('Admin login is not configured:', error);
    return NextResponse.json({ error: 'Admin login is not configured.' }, { status: 503 });
  }
}
