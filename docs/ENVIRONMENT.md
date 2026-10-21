# Local environment setup

The portfolio and admin panel use the same Next.js app and server:

- `.env.local` is read by the root seed command.
- `apps/web/.env.local` is read by the unified web and admin app.

Existing values in `apps/admin/.env.local` are not loaded by the unified app. Move any values you
need from there to `apps/web/.env.local`; do not commit local environment files or paste secrets
into issues or public logs.

## Values still required

Configure the unified app's values in `apps/web/.env.local` and database seed values in the root
`.env.local`:

1. Create a MongoDB Atlas database user with least-privilege access and set `MONGODB_URI` in both
   files. Keep `MONGODB_DB=anil_portfolio`.
2. Generate the admin password hash in PowerShell from the repository root:

   ```powershell
   npm run admin:hash-password
   ```

   Copy the printed `ADMIN_PASSWORD_HASH=...` value into `apps/web/.env.local`. Do not put the plain
   password in an environment file. The script requires a password of at least 14 characters.
3. Create a Cloudinary account and set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET` in `apps/web/.env.local`. These enable signed blog image and Resume PDF
   uploads. Never expose the API secret through a `NEXT_PUBLIC_` variable.
4. Set `NEXT_PUBLIC_SITE_URL` to the final canonical HTTPS domain before a production build.
   Never deploy with `localhost` or the example domain: this value is used for canonical metadata,
   structured data, Open Graph URLs, and the sitemap. Set `ADMIN_ORIGIN` to the same origin as the
   app (`http://localhost:3000` for local development).
5. Deploy the unified app with the root `netlify.toml` and configure the required variables once in that
   site's server-side environment settings. Use production-only values; do not upload local
   `.env.local` files.
6. For AI article generation, add the selected provider key to `apps/web/.env.local`
   (`GROQ_API_KEY`, `GEMINI_API_KEY`, or `OPENROUTER_API_KEY`). These keys are read on the server
   only. Never use a `NEXT_PUBLIC_` prefix or paste keys into the dashboard. Restart the dev server
   after changing the file. In production, configure the selected key in the unified site's
   server-side environment settings.

The session secret was generated locally for development. Create a separate high-entropy value for
production and configure it on the unified app.

## Start the app

```powershell
npm run dev
```

The public portfolio is at `http://localhost:3000/` and the admin panel is at
`http://localhost:3000/anil_a`. Both are served by the same Next.js app on one port. Login and
database-backed blog operations require the Atlas URI and admin password hash. Image uploads require
Cloudinary credentials. The admin panel can upload a PDF Resume up to 10 MB; save the portfolio
after upload to update the public download link.

Seed the portfolio and sample articles after adding the Atlas URI:

```powershell
npm run db:seed
```

The seed is idempotent and preserves existing records. Sample articles remain marked `noindex`.
