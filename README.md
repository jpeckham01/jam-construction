# JAM Construction Services LLC

Website for Jorge Mercado's JAM Construction Services LLC (stone walls, stairs, patios, walkways, pool decks, fences, decks, garages, outdoor fireplaces). English and Spanish.

- Live (English): https://jamconstructionmd.com/
- Live (Spanish): https://jamconstructionmd.com/es/

## How it's built

- **Edit `src/template.html`**, not `index.html`. All text (English and Spanish), services and jobs are in the `TEXT`, `SERVICES` and `PROJECTS` blocks near the bottom.
- To add a job: add an entry to `PROJECTS` (title, note and `alts` photo descriptions in both languages) and put the photos in `photos/`.
- Then run `npm install` (first time) and `npm run build`. This writes `index.html` (English), `es/index.html` (Spanish), `sitemap.xml` and `robots.txt` with all text pre-rendered into the HTML, so search engines see it without running JavaScript. Commit everything and push; GitHub Pages redeploys in about a minute.
- Per-language page titles, descriptions and hreflang tags are set in `build.mjs`.

## Custom domain cutover (jamconstructionmd.com)
1. In `build.mjs`, set `BASE = "https://jamconstructionmd.com/"` and run `npm run build`.
2. Add a `CNAME` file containing `jamconstructionmd.com`.
3. DNS at the registrar: A records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME `www` → `jpeckham01.github.io`.
4. Settings → Pages → Custom domain, then tick "Enforce HTTPS" once the certificate is issued.
5. Submit `https://jamconstructionmd.com/sitemap.xml` in Google Search Console.
