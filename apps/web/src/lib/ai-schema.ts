import { z } from 'zod';

export const aiSettingsSchema = z.object({
  provider: z.enum(['groq', 'gemini', 'openrouter']),
  model: z.string().trim().min(2).max(120),
  dailyEnabled: z.boolean(),
  dailyAt: z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|05|10|15|20|25|30|35|40|45|50|55)$/),
  timezone: z.string().min(1).max(80),
  dailyCount: z.number().int().min(1).max(10),
  autoPublishEnabled: z.boolean(),
  publishDelayMinutes: z.number().int().min(10).max(1440),
  topicMode: z.enum(['mixed', 'category']),
  categories: z.array(z.string().trim().min(2).max(80)).min(1).max(20),
  promptInstructions: z.string().trim().max(4000),
});

export type AiSettings = z.infer<typeof aiSettingsSchema>;

export const focusBlogCategories = [
  'AI Engineering',
  'MERN Stack Engineering',
  'Bugs & Production Issues',
  'Security & Vulnerabilities',
  'New Technology & Developer Tools',
  'Static Site Engineering',
];

const previousDefaultCategories = [
  'AI product engineering',
  'React and Next.js',
  'TypeScript',
  'Node.js and APIs',
  'Databases and system design',
  'Developer productivity',
];

export const defaultAiSettings: AiSettings = {
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  dailyEnabled: false,
  dailyAt: '09:00',
  timezone: 'Asia/Kolkata',
  dailyCount: 1,
  autoPublishEnabled: false,
  publishDelayMinutes: 10,
  topicMode: 'mixed',
  categories: focusBlogCategories,
  promptInstructions:
    'Write practical, technically accurate articles for software engineers. Use original explanations, cite current source links for news-dependent claims, distinguish facts from opinion, and never invent personal experience or project metrics.',
};

export function resolveAiSettings(stored: Record<string, unknown> = {}): AiSettings {
  const merged = { ...defaultAiSettings, ...stored };
  if (
    Array.isArray(stored.categories) &&
    stored.categories.length === previousDefaultCategories.length &&
    stored.categories.every((category, index) => category === previousDefaultCategories[index])
  ) {
    merged.categories = focusBlogCategories;
  }
  if (merged.provider === 'groq' && merged.model === 'llama-3.3-70b-versatile') {
    merged.model = 'openai/gpt-oss-120b';
  }
  if (merged.provider === 'gemini' && merged.model === 'gemini-2.5-flash') {
    merged.model = 'gemini-3.8-flash';
  }
  return aiSettingsSchema.parse(merged);
}
