You are a principal full-stack engineer (Next.js, MongoDB, security, technical SEO). Build a complete, production-ready MONOREPO that migrates my existing static portfolio into a CMS-driven Next.js platform with a highly secure admin dashboard and an SEO-first blog, deployed on Netlify. Work in phases, run typecheck/lint/build after each phase, fix problems, commit per phase, and continue automatically unless truly blocked. Do not ask me questions; use the defaults below and record assumptions in docs/ASSUMPTIONS.md.

==================================================
1. PROJECT GOAL
==================================================
- Owner: Anil Anuragee, AI-Native Full Stack Engineer, Indore, India (React, TypeScript, Node.js, MySQL, AI pipelines).
- I must be able to edit EVERY part of the portfolio (hero, stats, about, skills, experience, projects, journey, certifications, education, testimonials, FAQ, contact info, SEO settings, section order and visibility) from a private dashboard, without touching code or redeploying manually.
- I must be able to write blog posts in the dashboard with full SEO control (meta, keywords, canonical, OG image, schema, FAQ, slug, scheduling).
- Later, an AI pipeline will draft blog posts automatically for my review. Scaffold it now behind a feature flag.
- Main goal: rank #1 on Google for "Anil Anuragee" and grow reach and impressions. Another person with a similar name exists (singer, "Anil Anuragi"), so every page must clearly establish me as the software engineer.
- Hosting: Netlify. Database: MongoDB Atlas. I work on Windows (project folder D:\CODE\Anil-Anuragee), so all docs and scripts must work in PowerShell and avoid Linux-only commands.

==================================================
2. SOURCE FOR MIGRATION (important)
==================================================
My current design is a single generated HTML file:
D:\CODE\Anil-Anuragee\Anil Anuragee – AI-Native Full Stack Engineer.html
(the file name contains an en dash; quote the path). If present, also use the folder D:\CODE\Anil-Anuragee\site (static SEO version) as reference for JSON-LD, SEO files and copy.
Tasks:
- Read the HTML. Extract: CSS variables and design tokens, light/dark theme rules, all section copy, skill lists, experience, projects, FAQ, contact details, and the JS behaviors.
- The profile photo may be embedded as a base64 data URI. Extract it to a real image file (apps/web/public/images/anil-anuragee-full-stack-developer.jpg) and upload it to the media store during seeding.
- Create seed/portfolio.json from the extracted content and a script `npm db:seed` that loads it into MongoDB (idempotent: safe to re-run, never duplicates, never overwrites edits unless --force).
- Preserve the visual design faithfully: glassmorphism cards, animated gradient blobs, gradient text, typing role effect, animated counters, 3D photo tilt (hover devices only), cursor glow on cards, skills marquee + category tabs + live search, command palette (Ctrl/Cmd+K), scroll progress bar, active-nav highlighting, theme toggle, scroll-reveal, prefers-reduced-motion support.
- Port interactions into small React client components ("use client" only where needed). Everything else must be Server Components so all content is in the HTML for crawlers.

==================================================
3. TECH STACK (use latest stable versions; verify against current docs)
==================================================
- npm workspaces + Turborepo, Node LTS (.nvmrc), TypeScript strict everywhere.
- Next.js App Router + React (latest stable), Server Components by default, Server Actions for mutations (with origin checks), Route Handlers for webhooks.
- Tailwind CSS with the extracted design tokens mapped to CSS variables (keep the existing look).
- MongoDB Atlas with Mongoose (or the official driver + Zod). Use a cached global connection pattern for serverless, small maxPoolSize, indexes defined in code, and a migrations folder.
- Zod for all validation (shared schemas in packages/validators).
- Auth: Auth.js (NextAuth v5) or a custom session layer, see Security section.
- Rich text: TipTap editor storing both JSON and sanitized HTML, plus Markdown import/export.
- Images: Cloudinary (signed uploads from the admin, never expose secrets); abstract behind packages/storage so it can be swapped. Netlify has no persistent disk, so never write uploads to the filesystem.
- Email: Resend behind packages/email (contact form notifications).
- Spam protection on the public contact form: Cloudflare Turnstile + honeypot + rate limit.
- Testing: Vitest (unit) and Playwright (smoke e2e: public pages, login, create post). CI: GitHub Actions (install, typecheck, lint, test, build).
- Tooling: ESLint, Prettier, Husky + lint-staged, Conventional Commits.

==================================================
4. MONOREPO STRUCTURE (create this large, well-organized layout)
==================================================
anil-portfolio/
  apps/
    web/                       PUBLIC site (portfolio + blog), SSG + ISR
      src/app/
        (site)/page.tsx                      home, sections rendered from DB in order
        (site)/projects/[slug]/page.tsx      case studies (e.g. Audiofy)
        (site)/blog/page.tsx                 blog index with pagination
        (site)/blog/[slug]/page.tsx          post page
        (site)/blog/category/[slug]/page.tsx
        (site)/blog/tag/[slug]/page.tsx
        (site)/search/page.tsx
        api/contact/route.ts                 saves message, emails me, rate limited
        api/revalidate/route.ts              signed webhook called by admin
        rss.xml/route.ts, sitemap.ts, robots.ts, llms.txt/route.ts
        opengraph-image.tsx, not-found.tsx, error.tsx
      src/components/{sections,blog,layout,seo,interactive,ui}
      src/lib/{data,seo,format}
    admin/                     PRIVATE dashboard, separate Next app + separate Netlify site
      src/app/(auth)/{login,two-factor,recover}
      src/app/(dashboard)/
        dashboard/                 overview: recent edits, drafts, messages, quick actions
        site-settings/             name, headline, summary, contact, socials, theme, global SEO
        sections/                  reorder (drag and drop), show/hide, edit each section
        stats/ about/ experience/ projects/ skills/ education/ certifications/
        testimonials/ faqs/ journey/
        blog/{posts,new,[id],categories,tags,calendar}
        media/                     library, upload, alt text, usage tracking
        seo/{global,redirects,sitemap-preview,robots,schema}
        messages/                  contact inbox (read, archive, reply, export)
        ai-studio/{topics,outlines,drafts,runs,settings}
        security/{profile,two-factor,sessions,api-keys,audit-log}
        backup/                    JSON export/import of all content
        preview/                   draft preview via short-lived signed token
      src/middleware.ts            auth gate, security headers, CSP nonce
      netlify/functions/           scheduled and background jobs (publish scheduled posts, AI drafts)
  packages/
    db/            connection, models, repositories, indexes, migrations, seed
    validators/    zod schemas shared by web and admin
    ui/            design system, tokens, shared section components
    seo/           metadata builders, JSON-LD builders, sitemap helpers, SEO score engine
    content/       markdown/MDX pipeline, HTML sanitizer, TOC, reading time, excerpt
    auth/          sessions, password hashing, TOTP, recovery codes, rate limiting, RBAC
    storage/       Cloudinary adapter + interface
    email/         Resend adapter
    ai/            provider interface, prompts, pipelines, guardrails, schedulers
    config/        eslint, tsconfig, tailwind, prettier presets
    types/ utils/
  scripts/         seed, import-from-html, backup, create-admin, generate-secrets
  seed/            portfolio.json and extracted assets
  docs/            see section 10
  .github/workflows/ci.yml
  CLAUDE.md, turbo.json, npm-workspace.yaml, package.json, .env.example, .nvmrc, .gitignore

==================================================
5. DATABASE (MongoDB) - collections and key fields
==================================================
users (email, passwordHash, role owner|editor, totpSecretEncrypted, recoveryCodesHashed, failedLogins, lockedUntil, lastLoginAt)
sessions (userId, hashedToken, ip, userAgent, createdAt, idleExpiresAt, absoluteExpiresAt, revokedAt)
siteSettings (singleton: name, alternateNames, headline, summary, location, openToWork, contact, socials, theme, defaultSeo, analyticsIds)
sections (key, type, title, order, enabled, data{}, updatedBy) - generic block model so any section is editable and reorderable
experiences, projects (with case-study fields and slug), skillCategories (with items), education, certifications, testimonials, faqs, journeyItems, stats
posts (title, slug, excerpt, content{json,html,markdown}, coverImage{url,alt}, status draft|scheduled|published|archived, publishedAt, scheduledAt, authorId, categoryIds, tagIds, readingTime, toc[], relatedPostIds[], seo{metaTitle, metaDescription, focusKeyword, keywords[], canonicalUrl, ogImage, noindex, schemaType, faq[]}, seoScore, source manual|ai, ai{model, promptVersion, runId, reviewStatus}, revisions ref)
categories, tags, media (url, publicId, alt, width, height, usedIn[]), redirects (from, to, statusCode, hits)
contactMessages (name, email, message, ip hash, status, createdAt)
revisions (entityType, entityId, snapshot, createdAt, createdBy) - every content edit keeps history with restore
auditLogs (actor, action, entity, diffSummary, ip, userAgent, createdAt)
aiTopics, aiRuns (inputs, outputs, tokens, cost estimate, status, error), apiKeys (hashed)
Add indexes (unique slugs, status+publishedAt, text index for search), TTL indexes for expired sessions, and document everything in docs/DATABASE.md.

==================================================
6. SECURITY (the admin must be very hard to attack)
==================================================
- Admin is a SEPARATE app on its own subdomain (for example admin.<domain>), noindex via meta + X-Robots-Tag + robots.txt Disallow, never linked from the public site.
- Single owner account by default; ADMIN_ALLOWED_EMAILS allowlist; no public sign-up route exists.
- Password hashing with Argon2id (or bcrypt if the native module is unsafe on Netlify; document the decision). Mandatory TOTP two-factor with encrypted secret and one-time recovery codes. Optional WebAuthn/passkeys as a stretch goal.
- Sessions: httpOnly, secure, sameSite=strict cookies, server-side session records, idle timeout and absolute timeout, rotation on login, revoke-all and per-device revoke.
- Rate limiting and progressive lockout on login, 2FA, password reset, contact form and API routes (use a persistent store such as MongoDB TTL or Upstash Redis; in-memory does not work on serverless).
- Server Actions and routes: verify authentication AND authorization on every call (never rely on middleware alone), check Origin/Host for CSRF, validate every input with Zod, return generic error messages.
- Strict CSP with nonces, HSTS, X-Content-Type-Options, frame-ancestors none for admin, Referrer-Policy, Permissions-Policy.
- Sanitize all rich HTML on save AND on render. No dangerouslySetInnerHTML without sanitized content.
- Secrets only in environment variables; never in code or logs; encrypt TOTP secrets at rest; redact PII in logs; hash IPs.
- Audit log for logins, failed attempts, content changes, setting changes, AI runs, exports.
- Webhooks between admin and web (revalidation) signed with HMAC and timestamp to prevent replay.
- Dependency hygiene: npm audit in CI, Dependabot config, lockfile committed.
- Document threat model and hardening checklist in docs/SECURITY.md, including MongoDB Atlas notes (Netlify uses dynamic IPs, so Atlas network access needs a documented, least-risk approach plus strong credentials, a least-privilege DB user, and backups).

==================================================
7. PUBLIC SITE + SEO REQUIREMENTS
==================================================
- Home page renders sections from the database in saved order using static generation with ISR and cache tags; the admin triggers on-demand revalidation (revalidateTag/revalidatePath) through the signed webhook after every publish or edit.
- All content present in server-rendered HTML. One h1 per page, semantic landmarks, WCAG AA contrast, keyboard accessible, no layout shift, next/image with explicit sizes, system font stack or next/font, minimal JS. Target 95+ Lighthouse on mobile.
- Metadata via the Metadata API from packages/seo: title pattern, descriptions under 160 chars, canonical, robots, Open Graph and Twitter cards, dynamic OG images (next/og) for home, projects and every post.
- Home title default: "Anil Anuragee – AI-Native Full Stack Engineer | React, Node.js, TypeScript".
- JSON-LD builders: WebSite, Person (name, alternateName, jobTitle, image, worksFor, alumniOf, address, knowsAbout, sameAs for LinkedIn/GitHub/Instagram), ProfilePage, FAQPage (matches visible FAQ), BlogPosting + BreadcrumbList for posts, Blog for the index, CreativeWork/Article for case studies.
- Dynamic sitemap.ts (home, projects, posts, categories, tags with lastmod), robots.ts, RSS feed, llms.txt, image sitemap entries, redirect handling from the redirects collection, custom 404.
- Blog: index with pagination, post pages with table of contents, reading time, related posts, author box, share links, category and tag archives, search, internal link suggestions, next/previous.
- Contact form posts to /api/contact (validated, rate-limited, Turnstile verified), stored in DB and emailed via Resend.
- Never invent testimonials, metrics, clients or links. Missing data stays as a clearly marked placeholder and appears in docs/CONTENT-TODO.md.

==================================================
8. ADMIN DASHBOARD FEATURES
==================================================
- Polished UI (reuse the portfolio design language), responsive, dark/light.
- Generic CRUD for every content type with validation, autosave drafts, revision history with restore, and "Publish" button that revalidates the public site.
- Sections manager with drag-and-drop ordering and show/hide.
- Blog editor: TipTap, slug auto-generation with redirect on slug change, cover image, categories and tags, schedule, preview link, revision history, and a LIVE SEO PANEL scoring: title length, meta description length, focus keyword in title/H1/first paragraph/slug/alt text, heading structure, internal and external links, image alt coverage, readability, word count, FAQ schema suggestions. Warn before publishing below a threshold.
- Media library with Cloudinary signed uploads, alt-text required before use in posts.
- SEO manager: global defaults, per-page overrides, redirects manager, robots and sitemap preview, schema preview/test.
- Messages inbox, audit log viewer, security center (2FA, sessions, API keys), JSON backup/export and import with dry-run.

==================================================
9. AI BLOG AUTOMATION (scaffold now, enable later)
==================================================
- packages/ai with a provider interface and an Anthropic Claude adapter by default (model name from env, never hard-coded), easy to swap.
- Pipeline: topic backlog -> keyword/intent brief -> outline -> draft -> SEO optimization -> fact-check flags -> plagiarism-lite check -> status "needs_review" in the dashboard. Default rule: AI never publishes by itself; a human approves. Allow an opt-in "auto-publish" setting that is OFF by default.
- Guardrails in prompts: write in my voice, do not invent personal facts, employers, metrics or quotes, cite sources when stating facts, include a draft disclosure field in the DB, keep prompts versioned (promptVersion stored per post).
- Execution: Netlify scheduled functions to queue work and background functions for long generation (respect timeouts); store runs, tokens and estimated cost in aiRuns; daily/monthly budget caps and rate limits.
- Feature flag AI_ENABLED=false by default. Build the admin AI Studio UI and a mocked provider so the full flow can be tested without an API key.
- Document in docs/AI-BLOG-ROADMAP.md.

==================================================
10. NETLIFY DEPLOYMENT
==================================================
- Two Netlify sites from the one repo: web (public) and admin (private). Provide a netlify.toml for each app with the correct build command (for example turbo run build --filter=...), base/publish settings, Node version, security headers, and the Next.js runtime. Check Netlify's current monorepo and Next.js documentation and follow it; list the exact dashboard settings in docs/DEPLOY-NETLIFY.md.
- Environment variables documented in .env.example with comments: MONGODB_URI, AUTH_SECRET, ENCRYPTION_KEY, ADMIN_ALLOWED_EMAILS, WEB_URL, ADMIN_URL, REVALIDATE_SECRET, CLOUDINARY_*, RESEND_API_KEY, TURNSTILE_*, ANTHROPIC_API_KEY (optional), AI_ENABLED, rate-limit store settings.
- Preview deploys must not use the production database; document separate Atlas databases/users.
- Include a domain section: keep https://anil-anuragee.netlify.app working or redirect it to the final domain, plus steps for a custom domain and Search Console.

==================================================
11. DOCUMENTATION TO WRITE (all in the repo)
==================================================
README.md (overview, quick start on Windows PowerShell, scripts), CLAUDE.md (project rules, commands, conventions for AI coding agents), docs/ARCHITECTURE.md (diagram in Mermaid, data flow, rendering and caching strategy), docs/DATABASE.md, docs/SECURITY.md, docs/DEPLOY-NETLIFY.md, docs/SEO.md (technical SEO + Search Console + backlinks + name-disambiguation strategy), docs/BLOG-WORKFLOW.md (writing, SEO checklist, publishing, scheduling), docs/AI-BLOG-ROADMAP.md, docs/MIGRATION-FROM-HTML.md, docs/CONTENT-MODEL.md, docs/DEV-SETUP-WINDOWS.md, docs/ASSUMPTIONS.md, docs/CONTENT-TODO.md, docs/CHECKLIST.md (launch checklist).

==================================================
12. PHASES (execute in order)
==================================================
Phase 0 scaffold monorepo, tooling, CI, env, docs skeleton.
Phase 1 packages: config, types, utils, validators, db (models, seed), content, seo.
Phase 2 packages/ui + apps/web: port design from the HTML, home page from seed data, projects/case study, SEO files.
Phase 3 packages/auth + apps/admin: login, 2FA, sessions, middleware, audit log.
Phase 4 admin CRUD for all content types, sections manager, media, revalidation webhook, revisions.
Phase 5 blog: models, editor, SEO panel, public blog pages, RSS, sitemap, OG images.
Phase 6 contact flow, messages inbox, security hardening pass, tests.
Phase 7 AI Studio scaffold with mocked provider and Netlify functions.
Phase 8 Netlify configs, docs finalization, launch checklist.
After each phase print a short status (done, how to test, next). At the end, list manual steps I must do: create Atlas cluster and user, Cloudinary, Resend, Turnstile, run `npm db:seed`, `npm create-admin`, set Netlify env vars, deploy both sites, verify Search Console, and confirm with my employer that the Audiofy case study may be public.

==================================================
13. RULES
==================================================
- Production quality: no TODO stubs in core paths, no secrets in the repo, no placeholder lorem ipsum, no invented facts.
- Use typographic apostrophes and quotes in visible text.
- Keep files small and well named; shared logic goes in packages, not duplicated in apps.
- Prefer boring, well-supported libraries; justify any heavy dependency in docs/ASSUMPTIONS.md.
- Validate before finishing: npm typecheck, npm lint, npm test, npm build must pass; seed script must run cleanly; every page must have one h1, valid JSON-LD, and working links.