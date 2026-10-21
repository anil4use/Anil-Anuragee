import { MongoClient, type Collection, type Db, type Document } from 'mongodb';

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
  portfolioMongo?: MongoCache;
};

const cache = (globalForMongo.portfolioMongo ??= { client: null, promise: null });

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required to access the content database.');
  }

  if (!cache.client) {
    cache.promise ??= new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 7000,
    }).connect();

    try {
      cache.client = await cache.promise;
    } catch (error) {
      cache.promise = null;
      throw error;
    }
  }

  return cache.client.db(process.env.MONGODB_DB || 'anil_portfolio');
}

export async function getBlogPostsCollection<TSchema extends Document = Document>(): Promise<
  Collection<TSchema>
> {
  const collection = (await getDatabase()).collection<TSchema>('blog_posts');
  await Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true, name: 'blog_slug_unique' }),
    collection.createIndex(
      { status: 1, publishedAt: -1 },
      { name: 'blog_status_published_date' },
    ),
    collection.createIndex(
      { aiAutomationKey: 1 },
      { unique: true, sparse: true, name: 'blog_ai_automation_key_unique' },
    ),
  ]);
  return collection;
}
