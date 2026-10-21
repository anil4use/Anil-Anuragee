import { z } from 'zod';

const optionalHttpsUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS URL.')
  .or(z.literal(''))
  .optional();

export const blogPostInput = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.'),
  excerpt: z.string().trim().min(20).max(320),
  category: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  keywords: z.array(z.string().trim().min(1).max(80)).max(20),
  contentMarkdown: z.string().min(50).max(100_000),
  status: z.enum(['draft', 'scheduled', 'published']),
  scheduledAt: z.string().datetime().nullable().optional(),
  seoTitle: z.string().trim().max(160).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  canonicalUrl: optionalHttpsUrl,
  ogImage: optionalHttpsUrl,
  ogImageAlt: z.string().trim().max(300).optional().default(''),
  noindex: z.boolean().default(false),
}).superRefine((post, context) => {
  if (post.status === 'scheduled' && !post.scheduledAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduledAt'],
      message: 'Choose a publish date and time for scheduled posts.',
    });
  }
  if (post.status === 'scheduled' && post.scheduledAt && Date.parse(post.scheduledAt) <= Date.now()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduledAt'],
      message: 'Scheduled publication must be in the future.',
    });
  }
});

export type BlogPostInput = z.infer<typeof blogPostInput>;
