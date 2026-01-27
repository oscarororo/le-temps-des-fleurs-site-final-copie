# SEO / Domain Canonicalization Notes

Goal: ensure the canonical domain is exactly https://www.letempsdesfloeurs.com/ across the site (meta tags, JSON-LD, robots, sitemap). Do not modify .bak files.

What I changed
- Updated `robots.txt` to point to the new sitemap: `Sitemap: https://www.letempsdesfloeurs.com/sitemap.xml`
- Created `sitemap.xml` at the repo root listing all non-.bak HTML pages using absolute `https://www.letempsdesfloeurs.com/...` URLs.
- Replaced .fr -> https://www.letempsdesfloeurs.com/ in canonical / OG / JSON-LD entries in multiple pages (not exhaustive list):
  - `liens/index.html` (JSON-LD Organization + WebSite)
  - `liens/notre-histoire.html`
  - `liens/le-joyeux.html`
  - `liens/le-audacieux.html`
  - `liens/le-amoureux.html`
  - `liens/nos-distributeurs.html`
  - `liens/a-cueillir-chez-nous.html`
  - `liens/ontenteuntrucensemble.html`
  - `liens/notre-mission.html`
  - `liens/le-toujours-chic.html`
  - `liens/le-champetre.html`
  - `liens/le-pourtoujours.html`
  - `liens/contact.html`
  - `liens/politique-confidentialite.html`
  - `liens/cookies.html`
  - `liens/cgv.html`
  - `liens/mentions-legales.html`
  - `liens/faq.html`
  - plus other edits to `style.css` and select pages earlier in the session.

Quick verification performed
- Repo-wide grep for `letempsdesfleurs|letempsdesfloeurs` (case-insensitive) shows no non-.bak files containing the old `letempsdesfleurs.fr` host. All remaining `.fr` occurrences are in `.bak` backup files.

Files created/edited
- Edited: `robots.txt` — point to www .com sitemap
- Added: `sitemap.xml` — canonical URLs for all public HTML pages
- Edited: many files under `liens/` (canonical / og / JSON-LD entries)
- Added: `NOTES_SEO.md` (this file)

Risks / Notes
- Backups (`*.bak`) still contain `.fr` references intentionally — I did not modify them. If you want the backups updated, I can replace them too, but best practice is to keep backups as-is.
- I did not change relative internal links (kept internal hrefs relative where they already were). This keeps the site portable in different environments.
- There may be external links (emails, social, third-party widgets) that legitimately point at other domains — I did not change those.
- If the site has server-side redirects (Vercel config) still pointing to `.fr`, those should be updated in deployment settings (not present in this repo). Vercel can also be configured to permanently redirect `.fr` requests to the canonical `.com` host.

Next recommended steps (I can do these):
1. Review `.bak` files and confirm whether you want them updated too.
2. Scan JS files for any hostname-based runtime redirects (e.g. code that reads window.location.hostname) and update if needed.
3. Deploy to a staging environment and verify headers and meta tags in a live HTML fetch (curl or online crawler).
4. Submit the new sitemap to Google Search Console (and Bing) and request reindexing.

Quality gates
- Build: N/A (static HTML/CSS)
- Lint / Typecheck: quick grep check for `.fr` in non-.bak files — PASS
- Tests: none present — N/A

If you'd like, I can now:
- Update `.bak` files too (safe, but they are backup artifacts)
- Scan all JS for hostname-based redirect code and patch it
- Run a small live-check (curl) against built pages (if you have a local server/dev URL)

— Automated edits performed by GitHub Copilot (assistant) in this working session
