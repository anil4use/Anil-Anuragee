# Admin panel and blog

## Run locally

From the repository root in PowerShell:

```powershell
npm install
npm run dev
```

The public site runs at `http://localhost:3000/`; the admin panel is at
`http://localhost:3000/anil_a`. Both use the same Next.js server and port. The root `npm run build`,
`npm run lint`, and `npm run typecheck` commands cover the unified application.

For deployment, set `NEXT_PUBLIC_SITE_URL` to the real canonical HTTPS URL before building. Configure
admin credentials, the session secret, MongoDB, Cloudinary, and any AI provider keys as server-side
environment variables. Never expose secrets through `NEXT_PUBLIC_` variables.
Deploy with the root `netlify.toml`; the admin panel is part of that site, not a separate deployment.

Keep local app and seed settings in `apps/web/.env.local`. The old `apps/admin/.env.local` is not
used by the unified app.

Without `MONGODB_URI`, the public site uses bundled sample blog posts. They are marked `noindex` and
excluded from the sitemap.

In the Blog posts editor, upload a featured image for the article card, article header, and social
preview, or insert separate images inline in the Markdown body. Fenced code blocks with language
labels are syntax highlighted and include a copy button.

To replace the Resume, open the Portfolio content tab, upload a PDF (maximum 10 MB), and select
“Save portfolio.” The public hero download link uses the saved Resume URL.
