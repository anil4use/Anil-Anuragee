import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({ authenticated: await hasAdminSession() });
}
