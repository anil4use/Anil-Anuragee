import { z } from 'zod';

const contentSection = z.object({}).passthrough();
const sectionIds = [
  'hero',
  'about',
  'audiofy',
  'skills',
  'experience',
  'projects',
  'journey',
  'credentials',
  'writing',
  'blog',
  'contact',
] as const;

export const portfolioSaveSchema = z.object({
  content: z
    .object({
      site: contentSection,
      hero: contentSection,
      about: contentSection,
      audiofy: contentSection,
      skills: contentSection,
      experience: z.array(contentSection),
      projects: z.array(contentSection),
      journey: z.array(contentSection),
      credential: contentSection,
      writing: z.array(contentSection),
      contact: contentSection,
      sectionCopy: contentSection,
    })
    .passthrough(),
  sections: z
    .array(
      z.object({
        id: z.enum(sectionIds),
        label: z.string().min(1).max(80),
        enabled: z.boolean(),
        order: z.number().int().min(0).max(100),
      }),
    )
    .length(sectionIds.length),
}).superRefine((value, context) => {
  const ids = value.sections.map((section) => section.id);
  if (new Set(ids).size !== sectionIds.length || sectionIds.some((id) => !ids.includes(id))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sections'],
      message: 'Section settings must contain each portfolio section exactly once.',
    });
  }
});

export type PortfolioSaveInput = z.infer<typeof portfolioSaveSchema>;
