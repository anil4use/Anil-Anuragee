import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'portfolio_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', requiredEnv('SESSION_SECRET')).update(payload).digest('base64url');
}

export function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const expectedOrigin =
    process.env.ADMIN_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const encodedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedEmail || !encodedHash) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be configured.');
  }

  const [salt, hash] = encodedHash.split(':');
  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase() || !salt || !hash) {
    return false;
  }

  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function createSession(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, expiresAt: Date.now() + SESSION_SECONDS * 1000 }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function validateSession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email: string;
      expiresAt: number;
    };
    const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    return Boolean(expectedEmail && session.email === expectedEmail && session.expiresAt > Date.now());
  } catch {
    return false;
  }
}

export function setAdminSession(response: Response, email: string): Response {
  const token = createSession(email);
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_SECONDS}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
  return response;
}

export function clearAdminSession(response: Response): Response {
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  );
  return response;
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return validateSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export function hasRequestAdminSession(request: NextRequest): boolean {
  return validateSession(request.cookies.get(SESSION_COOKIE)?.value);
}
