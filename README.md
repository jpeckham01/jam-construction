# JAM Construction Services LLC

Website for Jorge Mercado's JAM Construction Services LLC (stone walls, patios, walkways, pool decks, fences). English / Spanish.

- Live: https://jpeckham01.github.io/jam-construction/
- Static site: `index.html` + `photos/`. To add a job, add an entry to `PROJECTS` in `index.html` and drop the photo in `photos/`.

## Custom domain cutover (jamconstructionllc.com)
1. Add a `CNAME` file containing `jamconstructionllc.com`.
2. Replace `https://jpeckham01.github.io/jam-construction/` with `https://jamconstructionllc.com/` in `index.html`, `robots.txt`, `sitemap.xml`.
3. DNS at the registrar: A records for `@` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; CNAME `www` → `jpeckham01.github.io`.
4. Settings → Pages → Custom domain, then tick "Enforce HTTPS" once the certificate is issued.
