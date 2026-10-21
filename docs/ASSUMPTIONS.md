# Assumptions

- The portfolio content is derived from the generated HTML file in the workspace, with visual tokens preserved in the migrated site.
- The site is designed for Netlify deployment, while the admin dashboard remains a separate Next.js app for a private environment.
- MongoDB seeding is intended for Atlas or another MongoDB-compatible runtime; without `MONGODB_URI`, the seed script runs in dry-run mode for safe validation.
- The public portfolio is rendered mostly as server-side HTML to keep content crawlable and SEO-friendly.
- The command palette, theme toggle, and scroll progress behaviors are implemented as lightweight client-side enhancements while the main content remains server-rendered.
