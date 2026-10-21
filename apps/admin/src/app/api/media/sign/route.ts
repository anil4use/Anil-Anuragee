import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hasRequestAdminSession, isAllowedOrigin } from '@/lib/auth';
import { z } from 'zod';

const uploadSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function POST(request: NextRequest) {
  if (!hasRequestAdminSession(request)) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary upload is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid post slug.' }, { status: 400 });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'anil-portfolio/blog';
  const publicId = `${parsed.data.slug}-${timestamp}`;
  const allowedFormats = 'jpg,png,webp';
  const maxFileSize = 10_485_760;
  const signatureBase = `allowed_formats=${allowedFormats}&folder=${folder}&max_file_size=${maxFileSize}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha1').update(signatureBase).digest('hex');

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    folder,
    publicId,
    allowedFormats,
    maxFileSize,
    signature,
  });
}
