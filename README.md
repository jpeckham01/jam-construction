# JAM Construction Services LLC

Website for Jorge Mercado's JAM Construction Services LLC (stone walls, stairs, patios, walkways, pool decks, fences, decks, garages, outdoor fireplaces). English and Spanish.

- Live (English): https://jamconstructionmd.com/
- Live (Spanish): https://jamconstructionmd.com/es/

## How it's built

- **Edit `src/template.html`**, not `index.html`. All text (English and Spanish) and services are in the `TEXT` and `SERVICES` blocks near the bottom.
- Jobs are in `data/jobs.json`. To add one by hand: add an entry (title, note and `alts` photo descriptions in both languages) and put the photos in `photos/`.
- Then run `npm install` (first time) and `npm run build`. This writes `index.html` (English), `es/index.html` (Spanish), `sitemap.xml` and `robots.txt` with all text pre-rendered into the HTML, so search engines see it without running JavaScript. Commit everything and push; GitHub Pages redeploys in about a minute.
- Per-language page titles, descriptions and hreflang tags are set in `build.mjs`.

## Text-to-website (Jorge texts photos → new job on the site)

1. Jorge (or the admin) texts photos, optionally with a short note (e.g. "patio de piedra en Towson"), to the Twilio number.
2. Twilio sends each text to the Cloudflare Worker in `worker/` (`POST /sms`). It checks the Twilio signature, only accepts
   `ALLOWED_NUMBERS`, saves each text and photo in KV, and every 2 minutes posts a conversation that has been quiet for
   3 minutes (or got "LISTO") as one commit under `inbox/<id>/`.
3. That push runs `.github/workflows/site.yml`: `scripts/process-inbox.mjs` re-encodes the photos (no GPS/EXIF, max 1600px),
   asks Claude for the title/category/town/English+Spanish text, adds the job to the top of `data/jobs.json`, builds,
   commits, publishes to GitHub Pages, then `scripts/notify.mjs` texts Jorge the link and sends the admin a heads-up.
4. "BORRAR" (admin) removes the newest texted-in job. Jorge isn't told about it; the admin manages removals.
5. The gallery shows at most `MAX_JOBS` jobs (repo variable, default 48, featured included); the gallery shows 12 per page. Older ones move to
   `data/archive.json` and `archive/photos/` (kept in the repo, not published).

Secrets: Worker → `TWILIO_AUTH_TOKEN`, `GITHUB_TOKEN`. GitHub repo → secrets `ANTHROPIC_API_KEY`,
`TWILIO_AUTH_TOKEN`; variables `TWILIO_ACCOUNT_SID`, `TWILIO_FROM` (the Twilio number), `ADMIN_NUMBER`.
Jobs are in `data/jobs.json` (newest first; `featured` jobs always show first).


### Same job, more photos
Photos sent within 24 hours of the last texted-in post are compared with it by the AI. If they show the same job,
they are added to that post (which moves back to the top and gets a fresh write-up) instead of becoming a new post.
If the AI can't be reached, photos sent within 2 hours of the last post are added to it. To force a new post,
start the text with **NUEVO** (or NEW). Tune with the `MERGE_HOURS` and `FALLBACK_MERGE_HOURS` variables.

## Custom domain cutover (jamconstructionmd.com)
1. In `build.mjs`, set `BASE = "https://jamconstructionmd.com/"` and run `npm run build`.
2. Add a `CNAME` file containing `jamconstructionmd.com`.
3. DNS at the registrar: A records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME `www` → `jpeckham01.github.io`.
4. Settings → Pages → Custom domain, then tick "Enforce HTTPS" once the certificate is issued.
5. Submit `https://jamconstructionmd.com/sitemap.xml` in Google Search Console.
