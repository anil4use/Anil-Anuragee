import { MongoClient } from 'mongodb';

export const config = {
  schedule: '*/5 * * * *',
};

export async function handler() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('AI publication cron skipped: MONGODB_URI is not configured.');
    return { statusCode: 503, body: 'MongoDB is not configured.' };
  }

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 7000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'anil_portfolio');
    const settings = await db
      .collection<{ _id: string; [key: string]: unknown }>('ai_settings')
      .findOne({ _id: 'main' });
    if (!settings?.autoPublishEnabled) {
      return { statusCode: 200, body: 'Scheduled AI publishing is disabled.' };
    }

    const now = new Date().toISOString();
    const posts = db.collection('blog_posts');
    const due = await posts
      .find(
        {
          status: 'draft',
          aiGenerated: true,
          autoPublishAt: { $lte: now },
        },
        { projection: { _id: 1 } },
      )
      .sort({ autoPublishAt: 1 })
      .limit(20)
      .toArray();

    if (due.length === 0) return { statusCode: 200, body: 'No AI drafts are due for publication.' };
    const ids = due.map((post) => post._id);
    const result = await posts.updateMany(
      { _id: { $in: ids }, status: 'draft', autoPublishAt: { $lte: now } },
      {
        $set: {
          status: 'published',
          publishedAt: now,
          noindex: false,
          updatedAt: now,
        },
      },
    );

    await db.collection<{ _id: string; [key: string]: unknown }>('ai_settings').updateOne(
      { _id: 'main' },
      {
        $set: {
          lastPublishRunAt: now,
          lastPublishCount: result.modifiedCount,
          lastPublishStatus: 'complete',
        },
      },
    );
    return { statusCode: 200, body: `Automatically published ${result.modifiedCount} AI article(s).` };
  } catch (error) {
    console.error('Scheduled AI publication failed:', error);
    try {
      const db = client.db(process.env.MONGODB_DB || 'anil_portfolio');
      await db.collection('ai_settings').updateOne(
        { _id: 'main' },
        { $set: { lastPublishRunAt: new Date().toISOString(), lastPublishStatus: 'failed' } },
      );
    } catch (logError) {
      console.error('Unable to record AI publication failure:', logError);
    }
    return { statusCode: 500, body: 'Scheduled AI publication failed.' };
  } finally {
    await client.close();
  }
};
