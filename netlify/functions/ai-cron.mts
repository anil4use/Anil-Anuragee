import { MongoClient } from 'mongodb';
import { generateDraftBatch } from '../../apps/admin/src/lib/ai-generator';
import { resolveAiSettings } from '../../apps/admin/src/lib/ai-schema';

export const config = {
  schedule: '*/5 * * * *',
};

function localClock(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
  };
}

export async function handler() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('AI cron skipped: MONGODB_URI is not configured.');
    return { statusCode: 503, body: 'MongoDB is not configured.' };
  }

  const client = new MongoClient(uri, { maxPoolSize: 3, serverSelectionTimeoutMS: 7000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'anil_portfolio');
    const settingsCollection = db.collection<{ _id: string; [key: string]: unknown }>('ai_settings');
    const stored = await settingsCollection.findOne({ _id: 'main' });
    const settings = resolveAiSettings(stored || {});

    if (!settings.dailyEnabled) return { statusCode: 200, body: 'Daily AI drafting is disabled.' };

    const now = new Date();
    const clock = localClock(now, settings.timezone);
    if (clock.time < settings.dailyAt) {
      return { statusCode: 200, body: `Not due yet for ${clock.date}.` };
    }
    if (stored?.lastRunDate === clock.date && stored?.lastRunStatus === 'complete') {
      return { statusCode: 200, body: `Already ran for ${clock.date}.` };
    }

    const staleRunCutoff = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const claim = await settingsCollection.updateOne(
      {
        _id: 'main',
        $or: [
          { lastRunStatus: { $ne: 'running' } },
          { lastRunStartedAt: { $lte: staleRunCutoff } },
        ],
      },
      {
        $set: {
          lastRunStartedAt: now.toISOString(),
          lastRunStatus: 'running',
        },
      },
    );
    if (claim.modifiedCount !== 1) {
      return { statusCode: 200, body: `Another scheduled run claimed ${clock.date}.` };
    }

    try {
      const posts = db.collection('blog_posts');
      await posts.createIndex({ slug: 1 }, { unique: true, name: 'blog_slug_unique' });
      await posts.createIndex({ status: 1, publishedAt: -1 }, { name: 'blog_status_published_date' });
      await posts.createIndex({ aiAutomationKey: 1 }, { unique: true, sparse: true, name: 'ai_automation_key_unique' });
      const recent = await posts
        .find({ aiGenerated: true }, { projection: { title: 1, _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();
      const batch = await generateDraftBatch(settings, posts, {
        batchId: `daily-${clock.date}`,
        recentTitles: recent.map((item) => String(item.title || '')),
      });
      await settingsCollection.updateOne(
        { _id: 'main' },
        {
          $set: {
            lastRunStatus: 'complete',
            lastRunDate: clock.date,
            lastRunCompletedAt: new Date().toISOString(),
            lastRunCount: batch.count,
            lastRunError: '',
          },
        },
      );
      return { statusCode: 200, body: `Created ${batch.count} review drafts from ${batch.sourceCount} current source headlines.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scheduler failure.';
      await settingsCollection.updateOne(
        { _id: 'main' },
        { $set: { lastRunStatus: 'failed', lastRunError: message, lastRunCompletedAt: new Date().toISOString() } },
      );
      console.error('Scheduled AI blog draft generation failed:', error);
      return { statusCode: 500, body: 'Scheduled AI draft generation failed.' };
    }
  } catch (error) {
    console.error('Unable to run AI cron function:', error);
    return { statusCode: 500, body: 'Unable to run AI scheduler.' };
  } finally {
    await client.close();
  }
};
