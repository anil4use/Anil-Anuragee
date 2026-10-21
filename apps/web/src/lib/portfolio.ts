import portfolioData from '../../../../seed/portfolio.json';
import { getDatabase } from '@db';

export type PortfolioData = typeof portfolioData;

export type PortfolioSection = {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
};

export const defaultPortfolioSections: PortfolioSection[] = [
  { id: 'hero', label: 'Hero', enabled: true, order: 0 },
  { id: 'about', label: 'About & stats', enabled: true, order: 1 },
  { id: 'audiofy', label: 'Audiofy', enabled: true, order: 2 },
  { id: 'skills', label: 'Skills', enabled: true, order: 3 },
  { id: 'experience', label: 'Experience', enabled: true, order: 4 },
  { id: 'projects', label: 'Projects', enabled: true, order: 5 },
  { id: 'journey', label: 'Journey', enabled: true, order: 6 },
  { id: 'credentials', label: 'Credentials & education', enabled: true, order: 7 },
  { id: 'writing', label: 'Community', enabled: true, order: 8 },
  { id: 'blog', label: 'Blog', enabled: true, order: 9 },
  { id: 'contact', label: 'Contact', enabled: true, order: 10 },
];

export function mergePortfolioWithDefaults<T>(defaults: T, stored: unknown): T {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(stored)) return defaults;
    const defaultEntries = defaults as unknown[];
    const storedEntries = stored as unknown[];
    const hasCompanyIdentity = defaultEntries.some(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).company === 'string',
    );
    if (!hasCompanyIdentity) return stored as T;

    return storedEntries.map((storedItem) => {
      if (!storedItem || typeof storedItem !== 'object') return storedItem;
      const company = (storedItem as Record<string, unknown>).company;
      const defaultsItem = defaultEntries.find(
        (item) =>
          item &&
          typeof item === 'object' &&
          (item as Record<string, unknown>).company === company,
      );
      return defaultsItem
        ? mergePortfolioWithDefaults(defaultsItem, storedItem)
        : storedItem;
    }) as T;
  }
  if (defaults && typeof defaults === 'object') {
    const storedObject =
      stored && typeof stored === 'object' && !Array.isArray(stored)
        ? (stored as Record<string, unknown>)
        : {};
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(defaults)) {
      result[key] = mergePortfolioWithDefaults(value, storedObject[key]);
    }
    for (const [key, value] of Object.entries(storedObject)) {
      if (!(key in result)) result[key] = value;
    }
    return result as T;
  }
  return (stored === undefined ? defaults : stored) as T;
}

export async function getPortfolioContent(): Promise<{
  content: PortfolioData;
  sections: PortfolioSection[];
}> {
  if (!process.env.MONGODB_URI) {
    return { content: portfolioData, sections: defaultPortfolioSections };
  }

  const collection = (await getDatabase()).collection('portfolio');
  const stored = await collection.findOne({ name: portfolioData.site.name });
  if (!stored) return { content: portfolioData, sections: defaultPortfolioSections };

  const content = Object.fromEntries(
    Object.entries(stored).filter(
      ([key]) => !['_id', 'name', 'seededAt', 'updatedAt', 'sectionSettings'].includes(key),
    ),
  );
  const sectionSettings = stored.sectionSettings;

  const mergedSections = defaultPortfolioSections.map((defaultSection) => {
    const savedSection = Array.isArray(sectionSettings)
      ? (sectionSettings as PortfolioSection[]).find((section) => section.id === defaultSection.id)
      : undefined;
    return savedSection
      ? { ...defaultSection, enabled: savedSection.enabled, order: savedSection.order }
      : defaultSection;
  });

  return {
    content: mergePortfolioWithDefaults(portfolioData, content),
    sections: mergedSections.sort((a, b) => a.order - b.order),
  };
}
