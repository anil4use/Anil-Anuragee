'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { JsonTreeEditor } from '@/components/JsonTreeEditor';

type BlogStatus = 'draft' | 'scheduled' | 'published';
type AdminTab = 'blog' | 'portfolio' | 'ai';
type EditableSection = {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
};
type AiSettings = {
  provider: 'groq' | 'gemini' | 'openrouter';
  model: string;
  dailyEnabled: boolean;
  dailyAt: string;
  timezone: string;
  dailyCount: number;
  autoPublishEnabled: boolean;
  publishDelayMinutes: number;
  topicMode: 'mixed' | 'category';
  categories: string[];
  promptInstructions: string;
};

const defaultAiSettings: AiSettings = {
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  dailyEnabled: false,
  dailyAt: '09:00',
  timezone: 'Asia/Kolkata',
  dailyCount: 1,
  autoPublishEnabled: false,
  publishDelayMinutes: 10,
  topicMode: 'mixed',
  categories: ['AI product engineering', 'React and Next.js', 'TypeScript', 'Node.js and APIs'],
  promptInstructions:
    'Write useful, technically accurate articles. Cite current sources for news-based claims. Do not invent personal experiences or results.',
};

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  keywords: string[];
  contentMarkdown: string;
  status: BlogStatus;
  scheduledAt: string | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  ogImageAlt: string;
  noindex: boolean;
  publishedAt: string | null;
  updatedAt?: string;
  createdAt?: string;
  readTime?: string;
};

const blankPost = (): Post => ({
  slug: '',
  title: '',
  excerpt: '',
  category: '',
  tags: [],
  keywords: [],
  contentMarkdown: '',
  status: 'draft',
  scheduledAt: null,
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  ogImage: '',
  ogImageAlt: '',
  noindex: false,
  publishedAt: null,
});

function toLocalDateTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdminPortal() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post>(blankPost());
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('blog');
  const [portfolioJson, setPortfolioJson] = useState('');
  const [portfolioView, setPortfolioView] = useState<'form' | 'json'>('form');
  const [portfolioSections, setPortfolioSections] = useState<EditableSection[]>([]);
  const [aiSettings, setAiSettings] = useState<AiSettings>(defaultAiSettings);
  const [aiRunSummary, setAiRunSummary] = useState('');
  const [aiModelCheck, setAiModelCheck] = useState('');
  const [checkingAiModel, setCheckingAiModel] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const contentInput = useRef<HTMLTextAreaElement>(null);
  let parsedPortfolio: unknown = null;
  try {
    parsedPortfolio = portfolioJson ? JSON.parse(portfolioJson) as unknown : {};
  } catch {
    parsedPortfolio = null;
  }

  const loadPosts = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/posts', { cache: 'no-store' });
      const result = (await response.json()) as { posts?: Post[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to load blog posts.');
      setPosts(result.posts || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load blog posts.');
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/portfolio', { cache: 'no-store' });
      const result = (await response.json()) as {
        content?: Record<string, unknown>;
        sections?: EditableSection[];
        error?: string;
      };
      if (!response.ok || !result.content || !result.sections) {
        throw new Error(result.error || 'Unable to load portfolio content.');
      }
      setPortfolioJson(JSON.stringify(result.content, null, 2));
      setPortfolioSections(result.sections);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load portfolio content.');
    }
  }, []);

  const loadAiSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/settings', { cache: 'no-store' });
      const result = (await response.json()) as {
        settings?: Partial<AiSettings> & Record<string, unknown>;
        error?: string;
      };
      if (!response.ok || !result.settings) {
        throw new Error(result.error || 'Unable to load AI writing settings.');
      }
      setAiSettings({ ...defaultAiSettings, ...result.settings });
      const draftStatus = result.settings.lastRunStatus
        ? `Draft generator last run: ${result.settings.lastRunStatus}${result.settings.lastRunCount ? ` · ${result.settings.lastRunCount} drafts` : ''}${result.settings.lastRunError ? ` · ${result.settings.lastRunError}` : ''}`
        : 'Draft generator has not run yet.';
      const publishStatus = result.settings.lastPublishStatus
        ? ` · Publisher last run: ${result.settings.lastPublishStatus}${result.settings.lastPublishCount ? ` · ${result.settings.lastPublishCount} posts` : ''}`
        : '';
      setAiRunSummary(`${draftStatus}${publishStatus}`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load AI writing settings.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not check admin session.');
        const result = (await response.json()) as { authenticated: boolean };
        if (!active) return;
        setAuthenticated(result.authenticated);
        if (result.authenticated) {
          await Promise.all([loadPosts(), loadPortfolio(), loadAiSettings()]);
        }
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setAuthenticated(false);
        setError(sessionError instanceof Error ? sessionError.message : 'Could not check admin session.');
      });
    return () => {
      active = false;
    };
  }, [loadAiSettings, loadPortfolio, loadPosts]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Login failed.');
      setPassword('');
      setAuthenticated(true);
      await Promise.all([loadPosts(), loadPortfolio(), loadAiSettings()]);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Unable to sign out.');
      setAuthenticated(false);
      setPosts([]);
      setPost(blankPost());
      setOriginalSlug(null);
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to sign out.');
    } finally {
      setBusy(false);
    }
  }

  async function selectPost(selected: Post) {
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(selected.slug)}`, { cache: 'no-store' });
      const result = (await response.json()) as { post?: Post; error?: string };
      if (!response.ok || !result.post) throw new Error(result.error || 'Unable to load article.');
      setPost(result.post);
      setOriginalSlug(result.post.slug);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load article.');
    }
  }

  function update<K extends keyof Post>(key: K, value: Post[K]) {
    setPost((current) => ({ ...current, [key]: value }));
  }

  function updateTitle(value: string) {
    update('title', value);
    if (originalSlug === null && !post.slug) {
      update('slug', value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>, status: BlogStatus) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    const body: Post = {
      ...post,
      status,
      scheduledAt:
        status === 'scheduled' && post.scheduledAt
          ? new Date(post.scheduledAt).toISOString()
          : null,
      publishedAt: null,
      tags: post.tags,
      keywords: post.keywords,
    };

    try {
      const response = await fetch(originalSlug ? `/api/posts/${encodeURIComponent(originalSlug)}` : '/api/posts', {
        method: originalSlug ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { post?: Post; error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to save post.');
      if (!result.post) throw new Error('The server returned no saved post.');
      setPost(result.post);
      setOriginalSlug(result.post.slug);
      setMessage(status === 'published' ? 'Post published.' : status === 'scheduled' ? 'Post scheduled.' : 'Draft saved.');
      await loadPosts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save post.');
    } finally {
      setBusy(false);
    }
  }

  async function deletePost() {
    if (!originalSlug || !window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(originalSlug)}`, { method: 'DELETE' });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to delete post.');
      setPost(blankPost());
      setOriginalSlug(null);
      setMessage('Post deleted.');
      await loadPosts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete post.');
    } finally {
      setBusy(false);
    }
  }

  function moveSection(index: number, direction: -1 | 1) {
    const next = [...portfolioSections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPortfolioSections(next.map((section, order) => ({ ...section, order })));
  }

  function toggleSection(id: string, enabled: boolean) {
    setPortfolioSections((current) =>
      current.map((section) => (section.id === id ? { ...section, enabled } : section)),
    );
  }

  async function savePortfolio() {
    setBusy(true);
    setError('');
    setMessage('');

    let content: unknown;
    try {
      content = JSON.parse(portfolioJson) as unknown;
    } catch {
      setBusy(false);
      setError('Portfolio data is not valid JSON. Fix the syntax before saving.');
      return;
    }

    try {
      const response = await fetch('/api/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sections: portfolioSections }),
      });
      const result = (await response.json()) as { error?: string; updatedAt?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to save portfolio.');
      setMessage(`Portfolio changes saved${result.updatedAt ? ` at ${new Date(result.updatedAt).toLocaleTimeString()}` : ''}. Refresh the public site to verify.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save portfolio.');
    } finally {
      setBusy(false);
    }
  }

  function updateAiSetting<K extends keyof AiSettings>(key: K, value: AiSettings[K]) {
    setAiSettings((current) => ({ ...current, [key]: value }));
  }

  async function checkAiModel() {
    setCheckingAiModel(true);
    setAiModelCheck('');
    setError('');
    try {
      const response = await fetch('/api/ai/models/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiSettings.provider, model: aiSettings.model }),
      });
      const result = (await response.json()) as { available?: boolean; message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to check the selected model.');
      setAiModelCheck(result.message || (result.available ? 'Model is available.' : 'Model is unavailable.'));
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : 'Unable to check the selected model.');
    } finally {
      setCheckingAiModel(false);
    }
  }

  async function saveAiSettings() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSettings),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to save AI settings.');
      setMessage('AI drafting and publication settings saved.');
      await loadAiSettings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save AI settings.');
    } finally {
      setBusy(false);
    }
  }

  async function generateAiDrafts() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const settingsResponse = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSettings),
      });
      const settingsResult = (await settingsResponse.json()) as { error?: string };
      if (!settingsResponse.ok) throw new Error(settingsResult.error || 'Save valid AI settings before generating.');

      const response = await fetch('/api/ai/generate', { method: 'POST' });
      const result = (await response.json()) as {
        count?: number;
        sourceCount?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || 'AI draft generation failed.');
      setMessage(`Generated ${result.count || 0} draft(s) using ${result.sourceCount || 0} current news sources. Open the Blog posts tab to review.`);
      await Promise.all([loadPosts(), loadAiSettings()]);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'AI draft generation failed.');
    } finally {
      setBusy(false);
    }
  }

  function exportPortfolio() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(portfolioJson) as unknown;
    } catch {
      setError('Fix the invalid JSON before exporting.');
      return;
    }
    const file = new Blob([JSON.stringify({ content: parsed, sections: portfolioSections }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'portfolio-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10_485_760) {
      setError('Choose a JPG, PNG, or WebP image smaller than 10 MB.');
      return;
    }

    if (!post.slug) {
      setError('Add a valid post slug before uploading an image.');
      return;
    }
    const altText = window.prompt('Describe this image for screen readers:', file.name.replace(/\.[^.]+$/, ''))?.trim();
    if (!altText) {
      setError('Add descriptive alt text before uploading the image.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const signedResponse = await fetch('/api/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: post.slug }),
      });
      const signed = (await signedResponse.json()) as {
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        folder?: string;
        publicId?: string;
        allowedFormats?: string;
        maxFileSize?: number;
        signature?: string;
        error?: string;
      };
      if (!signedResponse.ok) throw new Error(signed.error || 'Unable to authorize upload.');
      if (
        !signed.cloudName ||
        !signed.apiKey ||
        !signed.timestamp ||
        !signed.folder ||
        !signed.publicId ||
        !signed.allowedFormats ||
        !signed.maxFileSize ||
        !signed.signature
      ) {
        throw new Error('The upload authorization response is incomplete.');
      }

      const data = new FormData();
      data.set('file', file);
      data.set('api_key', signed.apiKey);
      data.set('timestamp', String(signed.timestamp));
      data.set('folder', signed.folder);
      data.set('public_id', signed.publicId);
      data.set('allowed_formats', signed.allowedFormats);
      data.set('max_file_size', String(signed.maxFileSize));
      data.set('signature', signed.signature);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
        method: 'POST',
        body: data,
      });
      const uploaded = (await uploadResponse.json()) as { secure_url?: string; error?: { message?: string } };
      if (!uploadResponse.ok || !uploaded.secure_url) {
        throw new Error(uploaded.error?.message || 'Cloudinary image upload failed.');
      }

      update('ogImage', uploaded.secure_url);
      update('ogImageAlt', altText);
      const imageMarkdown = `![${altText}](${uploaded.secure_url})`;
      const editor = contentInput.current;
      if (editor) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const next = `${post.contentMarkdown.slice(0, start)}${imageMarkdown}${post.contentMarkdown.slice(end)}`;
        update('contentMarkdown', next);
        requestAnimationFrame(() => {
          editor.focus();
          editor.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
        });
      } else {
        update('contentMarkdown', `${post.contentMarkdown}\n\n${imageMarkdown}`);
      }
      setMessage('Image uploaded and inserted in the article.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  if (authenticated === null) {
    return <main className="admin-shell"><p>Checking secure admin session…</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="login-shell">
        <form className="admin-card login-card" onSubmit={login}>
          <span className="admin-eyebrow">PRIVATE CONTENT MANAGEMENT</span>
          <h1>Sign in to your portfolio</h1>
          <p>Only authorized site administrators can access blog drafts and media management.</p>
          <label>
            Admin email
            <input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button className="admin-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="admin-footnote">Credentials are configured locally through environment variables.</p>
        </form>
      </main>
    );
  }

  const visiblePosts = posts.filter((item) => `${item.title} ${item.category} ${item.slug}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span className="admin-eyebrow">ANIL ANURAGEE · ADMIN</span>
          <h1>Portfolio studio</h1>
        </div>
        <div className="admin-top-actions">
          <a className="admin-quiet" href={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'} target="_blank" rel="noreferrer">View portfolio ↗</a>
          <button className="admin-quiet" onClick={logout} disabled={busy}>Sign out</button>
        </div>
      </header>

      <div className="admin-tabs" role="tablist" aria-label="Admin content areas">
        <button
          role="tab"
          aria-selected={activeTab === 'blog'}
          className={activeTab === 'blog' ? 'selected' : ''}
          onClick={() => { setActiveTab('blog'); setError(''); setMessage(''); }}
        >
          Blog posts
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'portfolio'}
          className={activeTab === 'portfolio' ? 'selected' : ''}
          onClick={() => { setActiveTab('portfolio'); setError(''); setMessage(''); }}
        >
          Portfolio content
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'ai'}
          className={activeTab === 'ai' ? 'selected' : ''}
          onClick={() => { setActiveTab('ai'); setError(''); setMessage(''); }}
        >
          AI & schedule
        </button>
      </div>

      {activeTab === 'ai' ? (
        <section className="admin-card ai-studio">
          <div className="portfolio-editor-heading">
            <div>
              <span className="admin-eyebrow">AI DRAFTING · TWO SCHEDULED JOBS</span>
              <h2>Configure automatic article creation</h2>
              <p>
                The first scheduled job finds current engineering headlines and creates the selected
                number of drafts. A separate publishing job can publish those AI drafts after the
                configured delay. Publishing is off until you explicitly enable it.
              </p>
            </div>
            <button className="admin-primary" type="button" onClick={() => void saveAiSettings()} disabled={busy}>
              {busy ? 'Saving…' : 'Save AI settings'}
            </button>
          </div>

          <p className="admin-muted ai-run-summary">{aiRunSummary || 'Loading scheduler status…'}</p>

          <div className="form-grid ai-settings-grid">
            <label>
              LLM provider
              <select
                value={aiSettings.provider}
                onChange={(event) => {
                  const provider = event.target.value as AiSettings['provider'];
                  const suggestedModel = {
                    groq: 'openai/gpt-oss-120b',
                    gemini: 'gemini-3.8-flash',
                    openrouter: 'google/gemini-3.8-flash',
                  }[provider];
                  setAiSettings((current) => ({ ...current, provider, model: suggestedModel }));
                }}
              >
                <option value="groq">Groq</option>
                <option value="gemini">Google Gemini</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </label>
            <label>
              Model
              <input value={aiSettings.model} onChange={(event) => updateAiSetting('model', event.target.value)} />
            </label>
            <div>
              <button className="admin-quiet" type="button" onClick={() => void checkAiModel()} disabled={checkingAiModel || busy}>
                {checkingAiModel ? 'Checking…' : 'Check model availability'}
              </button>
              {aiModelCheck && <p className="admin-muted" role="status">{aiModelCheck}</p>}
            </div>
            <label>
              Articles per run (1–10)
              <input type="number" min={1} max={10} value={aiSettings.dailyCount} onChange={(event) => updateAiSetting('dailyCount', Number(event.target.value))} />
            </label>
            <label>
              Topics mode
              <select value={aiSettings.topicMode} onChange={(event) => updateAiSetting('topicMode', event.target.value as AiSettings['topicMode'])}>
                <option value="mixed">Mix configured categories</option>
                <option value="category">Prioritize one category per run</option>
              </select>
            </label>
            <label>
              Daily generation time (5-minute intervals)
              <input type="time" step={300} value={aiSettings.dailyAt} onChange={(event) => updateAiSetting('dailyAt', event.target.value)} />
            </label>
            <label>
              Time zone (IANA, e.g. Asia/Kolkata)
              <input value={aiSettings.timezone} onChange={(event) => updateAiSetting('timezone', event.target.value)} />
            </label>
            <label className="wide">
              Topic categories (one per line)
              <textarea
                rows={4}
                value={aiSettings.categories.join('\n')}
                onChange={(event) => updateAiSetting('categories', event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))}
              />
            </label>
            <label className="wide">
              Editorial rules for the AI
              <textarea rows={5} maxLength={4000} value={aiSettings.promptInstructions} onChange={(event) => updateAiSetting('promptInstructions', event.target.value)} />
            </label>
          </div>

          <div className="ai-switches">
            <label className="checkbox-label">
              <input type="checkbox" checked={aiSettings.dailyEnabled} onChange={(event) => updateAiSetting('dailyEnabled', event.target.checked)} />
              Enable daily draft-generation cron
            </label>
            <div className="ai-autopublish-panel">
              <label className="checkbox-label">
                <input type="checkbox" checked={aiSettings.autoPublishEnabled} onChange={(event) => updateAiSetting('autoPublishEnabled', event.target.checked)} />
                Enable the second cron to automatically publish AI drafts
              </label>
              <label>
                Publish delay after draft creation (minutes; minimum 10)
                <input type="number" min={10} max={1440} value={aiSettings.publishDelayMinutes} onChange={(event) => updateAiSetting('publishDelayMinutes', Number(event.target.value))} />
              </label>
              <p className="admin-muted">
                Automatic publication means an AI-generated article can go live without your review.
                The publisher checks every five minutes, so a 10-minute delay may publish between
                10 and 15 minutes after a draft is created. Keep this off until you are comfortable
                with the generated quality.
              </p>
            </div>
          </div>

          <div className="ai-footer-actions">
            <button className="admin-primary" type="button" onClick={() => void generateAiDrafts()} disabled={busy}>
              {busy ? 'Generating…' : `Generate ${aiSettings.dailyCount} draft(s) now`}
            </button>
            <button className="admin-quiet" type="button" onClick={() => void saveAiSettings()} disabled={busy}>Save configuration</button>
            <span className="admin-muted">Manual generation always creates drafts first.</span>
          </div>
          {message && <p className="admin-success" role="status">{message}</p>}
          {error && <p className="admin-error" role="alert">{error}</p>}
        </section>
      ) : activeTab === 'portfolio' ? (
        <section className="admin-card portfolio-editor">
          <div className="portfolio-editor-heading">
            <div>
              <span className="admin-eyebrow">FULL SITE CONTENT CONTROL</span>
              <h2>Edit portfolio content</h2>
              <p>
                This JSON editor contains every portfolio field: profile details, hero copy, stats,
                experience, skills, projects, education, credentials, community links, and contact
                information. Save applies the changes to the public site data.
              </p>
            </div>
            <div className="admin-top-actions">
              <button className="admin-quiet" type="button" onClick={exportPortfolio}>Export backup</button>
              <button className="admin-quiet" type="button" onClick={() => void loadPortfolio()} disabled={busy}>Reload saved</button>
              <button className="admin-primary" type="button" onClick={() => void savePortfolio()} disabled={busy || parsedPortfolio === null}>{busy ? 'Saving…' : 'Save portfolio'}</button>
            </div>
          </div>

          <div className="section-manager">
            <div>
              <h3>Sections: visibility and order</h3>
              <p className="admin-muted">
                Turn sections on or off and move them up or down. The hero is the first profile block.
              </p>
            </div>
            <ol className="section-order-list">
              {portfolioSections.map((section, index) => (
                <li key={section.id} className={!section.enabled ? 'section-disabled' : ''}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(event) => toggleSection(section.id, event.target.checked)}
                    />
                    <span>{section.label}</span>
                  </label>
                  <div className="section-move-actions">
                    <button type="button" aria-label={`Move ${section.label} up`} disabled={index === 0} onClick={() => moveSection(index, -1)}>↑</button>
                    <button type="button" aria-label={`Move ${section.label} down`} disabled={index === portfolioSections.length - 1} onClick={() => moveSection(index, 1)}>↓</button>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <label className="portfolio-json-label">
            All editable portfolio fields
          </label>
          <div className="editor-mode-switch" aria-label="Portfolio editing mode">
            <button type="button" className={portfolioView === 'form' ? 'selected' : ''} onClick={() => setPortfolioView('form')}>Visual form</button>
            <button type="button" className={portfolioView === 'json' ? 'selected' : ''} disabled={parsedPortfolio === null} onClick={() => setPortfolioView('json')}>Raw JSON</button>
          </div>
          <p className="admin-muted">
            Edit all text, links, list items, stats, skills, and portfolio details below. The visual
            editor has expandable groups; switch to raw JSON for precise bulk edits.
          </p>
          {portfolioView === 'form' ? (
            <div className="portfolio-tree-editor">
              {parsedPortfolio === null ? (
                <p className="admin-error" role="alert">The raw JSON currently has a syntax error. Correct it in Raw JSON mode to continue.</p>
              ) : (
                <JsonTreeEditor
                  label="Portfolio"
                  value={parsedPortfolio}
                  onChange={(value) => setPortfolioJson(JSON.stringify(value, null, 2))}
                />
              )}
            </div>
          ) : (
            <>
              <label className="portfolio-json-label" htmlFor="portfolio-json">Portfolio data (JSON)</label>
              <textarea
                id="portfolio-json"
                className="portfolio-json-editor"
                spellCheck={false}
                value={portfolioJson}
                onChange={(event) => setPortfolioJson(event.target.value)}
              />
            </>
          )}
          {message && <p className="admin-success" role="status">{message}</p>}
          {error && <p className="admin-error" role="alert">{error}</p>}
        </section>
      ) : (
      <>
      <div className="admin-notice">
        <strong>Writing and publishing control.</strong> Drafts are private. Published posts appear on the
        public site and in its sitemap. Images upload directly to Cloudinary using a short-lived signed request.
      </div>

      <div className="admin-layout">
        <aside className="admin-card post-sidebar">
          <div className="sidebar-heading">
            <h2>Posts</h2>
            <button className="admin-primary small" onClick={() => { setPost(blankPost()); setOriginalSlug(null); setMessage(''); setError(''); }}>New post</button>
          </div>
          <input className="admin-search" aria-label="Search posts" placeholder="Search posts…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="post-list">
            {visiblePosts.length === 0 && <p className="admin-muted">No posts yet. Create your first article.</p>}
            {visiblePosts.map((item) => (
              <button className={`post-list-item ${originalSlug === item.slug ? 'active' : ''}`} key={item.slug} onClick={() => selectPost(item)}>
                <strong>{item.title}</strong>
                <span>{item.status} · {item.category}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-card editor-card">
          <form onSubmit={(event) => savePost(event, post.status)}>
            <div className="editor-heading">
              <div>
                <span className="admin-eyebrow">{originalSlug ? 'EDIT ARTICLE' : 'NEW ARTICLE'}</span>
                <h2>{post.title || 'Untitled post'}</h2>
              </div>
              {originalSlug && post.status === 'published' && (
                <a className="admin-quiet" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`} target="_blank" rel="noreferrer">View ↗</a>
              )}
            </div>

            <div className="form-grid">
              <label className="wide">
                Article title
                <input required minLength={3} maxLength={160} value={post.title} onChange={(event) => updateTitle(event.target.value)} />
              </label>
              <label>
                URL slug
                <input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={post.slug} onChange={(event) => update('slug', event.target.value)} />
              </label>
              <label>
                Category
                <input required value={post.category} onChange={(event) => update('category', event.target.value)} placeholder="AI Engineering" />
              </label>
              <label className="wide">
                Excerpt
                <textarea required minLength={20} maxLength={320} rows={2} value={post.excerpt} onChange={(event) => update('excerpt', event.target.value)} />
              </label>
              <label>
                Tags (comma separated)
                <input value={post.tags.join(', ')} onChange={(event) => update('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} />
              </label>
              <label>
                SEO keywords (comma separated)
                <input value={post.keywords.join(', ')} onChange={(event) => update('keywords', event.target.value.split(',').map((word) => word.trim()).filter(Boolean))} />
              </label>
            </div>

            <div className="content-label-row">
              <label htmlFor="article-content">Article body (Markdown)</label>
              <button type="button" className="admin-quiet" onClick={() => fileInput.current?.click()} disabled={busy}>Upload / insert image</button>
              <input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadImage(event.target.files?.[0])} />
            </div>
            <p className="admin-muted">Write the complete article here. Supports Markdown headings, paragraphs, lists, links, code blocks, and uploaded inline images.</p>
            <textarea
              id="article-content"
              ref={contentInput}
              className="markdown-editor"
              required
              minLength={50}
              maxLength={100000}
              value={post.contentMarkdown}
              onChange={(event) => update('contentMarkdown', event.target.value)}
              placeholder={'## Start writing\\n\\nWrite the full article here…'}
              spellCheck
            />

            <details className="seo-details">
              <summary>SEO and sharing settings</summary>
              <div className="form-grid seo-grid">
                <label>
                  SEO title
                  <input maxLength={160} value={post.seoTitle} onChange={(event) => update('seoTitle', event.target.value)} placeholder={post.title || 'Defaults to article title'} />
                </label>
                <label>
                  SEO description
                  <textarea rows={2} maxLength={320} value={post.seoDescription} onChange={(event) => update('seoDescription', event.target.value)} placeholder={post.excerpt || 'Defaults to article excerpt'} />
                </label>
                <label>
                  Canonical URL (optional)
                  <input type="url" value={post.canonicalUrl} onChange={(event) => update('canonicalUrl', event.target.value)} placeholder="https://example.com/original-article" />
                </label>
                <label>
                  Social sharing image URL
                  <input type="url" value={post.ogImage} onChange={(event) => update('ogImage', event.target.value)} placeholder="Upload an image or enter an HTTPS URL" />
                </label>
                <label>
                  Image alt text
                  <input maxLength={300} value={post.ogImageAlt} onChange={(event) => update('ogImageAlt', event.target.value)} placeholder="Describe the image for accessibility" />
                </label>
              </div>
                {post.ogImage && <Image className="og-preview" src={post.ogImage} alt={post.ogImageAlt || 'Social sharing image preview'} width={1200} height={630} unoptimized />}
              <label className="checkbox-label">
                <input type="checkbox" checked={post.noindex} onChange={(event) => update('noindex', event.target.checked)} />
                Keep this article out of search indexing
              </label>
            </details>

            <div className="publish-controls">
              <label>
                Publish timing
                <select value={post.status} onChange={(event) => update('status', event.target.value as BlogStatus)}>
                  <option value="draft">Save as draft</option>
                  <option value="published">Publish now</option>
                  <option value="scheduled">Schedule</option>
                </select>
              </label>
              {post.status === 'scheduled' && (
                <label>
                  Publish date and time
                  <input type="datetime-local" required value={toLocalDateTime(post.scheduledAt)} onChange={(event) => update('scheduledAt', event.target.value ? new Date(event.target.value).toISOString() : null)} />
                </label>
              )}
              <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : post.status === 'published' ? 'Save & publish' : post.status === 'scheduled' ? 'Save schedule' : 'Save draft'}</button>
              {originalSlug && <button className="admin-danger" type="button" onClick={deletePost} disabled={busy}>Delete</button>}
            </div>

            {message && <p className="admin-success" role="status">{message}</p>}
            {error && <p className="admin-error" role="alert">{error}</p>}
          </form>
        </section>
      </div>
      </>
      )}
    </main>
  );
}
