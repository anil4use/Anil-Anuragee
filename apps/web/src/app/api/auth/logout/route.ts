import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  clearAdminSession(response);
  return response;
}
