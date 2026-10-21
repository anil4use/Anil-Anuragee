import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const portfolio = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'seed', 'portfolio.json'), 'utf8'),
);
const samplePosts = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'seed', 'blog-posts.json'), 'utf8'),
);
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log('No MongoDB writes were made: MONGODB_URI is not configured.');
  console.log(`Validated seed content for ${portfolio.site.name} and ${samplePosts.length} sample blog posts.`);
  process.exit(0);
}

const force = process.argv.includes('--force');
const { MongoClient } = await import('mongodb');
const client = new MongoClient(uri, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 7000,
});

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'anil_portfolio');
  const portfolioCollection = db.collection('portfolio');
  const existingPortfolio = await portfolioCollection.findOne({ name: portfolio.site.name });

  if (!existingPortfolio || force) {
    await portfolioCollection.replaceOne(
      { name: portfolio.site.name },
      { ...portfolio, name: portfolio.site.name, seededAt: new Date().toISOString() },
      { upsert: true },
    );
    console.log(`Seeded portfolio content for ${portfolio.site.name}.`);
  } else {
    console.log('Existing portfolio content preserved. Pass --force to replace it with seed data.');
  }

  const posts = db.collection('blog_posts');
  await posts.createIndex({ slug: 1 }, { unique: true, name: 'blog_slug_unique' });
  await posts.createIndex(
    { status: 1, publishedAt: -1 },
    { name: 'blog_status_published_date' },
  );
  let inserted = 0;
  let preserved = 0;

  for (const sample of samplePosts) {
    const document = {
      slug: sample.slug,
      title: sample.title,
      excerpt: sample.excerpt,
      category: sample.category,
      tags: sample.tags,
      keywords: sample.keywords,
      contentMarkdown: sample.sections
        .map((section) => `## ${section.heading}\n\n${section.paragraphs.join('\n\n')}`)
        .join('\n\n'),
      status: 'published',
      scheduledAt: null,
      publishedAt: new Date(`${sample.publishedAt}T12:00:00.000Z`).toISOString(),
      readTime: sample.readTime,
      seoTitle: sample.title,
      seoDescription: sample.excerpt,
      canonicalUrl: '',
      ogImage: '',
      ogImageAlt: '',
      noindex: true,
      isSample: true,
      createdAt: new Date(`${sample.publishedAt}T12:00:00.000Z`).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const existing = await posts.findOne({ slug: sample.slug }, { projection: { _id: 1, isSample: 1 } });

    if (!existing) {
      await posts.insertOne(document);
      inserted += 1;
    } else if (force && existing.isSample) {
      await posts.replaceOne({ slug: sample.slug }, document);
      inserted += 1;
    } else {
      preserved += 1;
    }
  }

  console.log(`Sample blog posts inserted/updated: ${inserted}; existing posts preserved: ${preserved}.`);
  console.log('Sample articles remain noindex and are excluded from the public sitemap.');
} catch (error) {
  console.error('Database seed failed:', error);
  process.exitCode = 1;
} finally {
  await client.close();
}
