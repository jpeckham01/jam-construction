// Builds the static site from src/template.html.
// Runs the page's own render code in jsdom so every word is already in the HTML Google downloads,
// and writes an English page (index.html) and a Spanish page (es/index.html) with their own titles and tags.
//
//   npm install && npm run build
//
// At the custom-domain cutover, change BASE below and add a CNAME file.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { JSDOM } from "jsdom";
import { LEGAL, EFFECTIVE } from "./src/legal.mjs";

const BASE = "https://jamconstructionmd.com/";
const PHONE = "(443) 901-8869";
// Google review link from Jorge's Google Business Profile ("Ask for reviews" → copy link).
// Leave empty and the review section is left out of the site.
const REVIEW_URL = process.env.REVIEW_URL ?? "";

const PAGES = {
  en: {
    out: "index.html", root: "", home: "./", path: "", locale: "en_US", privacy: "privacy/", terms: "terms/",
    title: "Stone Walls, Patios & Hardscaping in Baltimore County | JAM Construction",
    description: "Stone walls, stone stairs, paver patios, walkways, pool decks, fences, decks, garages, outdoor fireplaces, bathrooms, basements and waterproofing in Baltimore County, MD. Competitive prices and free estimates. Se habla español.",
    ogTitle: "JAM Construction Services – Stone Walls, Patios & Hardscaping in Baltimore County",
    ogDescription: `Stone walls, patios, walkways, pool decks, fences, decks, garages and outdoor fireplaces. Competitive prices, free estimates – text Jorge at ${PHONE}.`,
  },
  es: {
    out: "es/index.html", root: "../", home: "../", path: "es/", locale: "es_US", privacy: "privacidad/", terms: "terminos/",
    title: "Muros de piedra, patios y paisajismo en el condado de Baltimore | JAM Construction",
    description: "Muros de piedra, escaleras de piedra, patios de adoquín, caminos, terrazas de piscina, cercas, decks, garajes, chimeneas al aire libre, baños, sótanos e impermeabilización en el condado de Baltimore, MD. Precios competitivos y presupuestos gratis.",
    ogTitle: "JAM Construction Services – Muros de piedra, patios y paisajismo en el condado de Baltimore",
    ogDescription: `Muros de piedra, patios, caminos, terrazas de piscina, cercas, decks, garajes y chimeneas al aire libre. Precios competitivos y presupuestos gratis – escriba a Jorge al ${PHONE}.`,
  },
};

const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
// Jobs: data/jobs.json, newest first. Featured jobs are always shown first.
const jobs = JSON.parse(readFileSync("data/jobs.json", "utf8"));
const ordered = [...jobs.filter((j) => j.featured), ...jobs.filter((j) => !j.featured)];
const jobsJs = JSON.stringify(ordered).replace(/</g, "\\u003c");
const template = readFileSync("src/template.html", "utf8").replace("/*JOBS*/[]/*END JOBS*/", jobsJs);

function seoHead(lang) {
  const p = PAGES[lang];
  const url = BASE + p.path;
  const alternates = Object.entries(PAGES)
    .map(([l, q]) => `<link rel="alternate" hreflang="${l}" href="${BASE + q.path}">`)
    .join("\n");
  return [
    `<title>${attr(p.title)}</title>`,
    `<meta name="description" content="${attr(p.description)}">`,
    `<link rel="canonical" href="${url}">`,
    alternates,
    `<link rel="alternate" hreflang="x-default" href="${BASE}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="JAM Construction Services">`,
    `<meta property="og:locale" content="${p.locale}">`,
    `<meta property="og:title" content="${attr(p.ogTitle)}">`,
    `<meta property="og:description" content="${attr(p.ogDescription)}">`,
    `<meta property="og:image" content="${BASE}photos/stone-wall-1.jpg">`,
    `<meta property="og:url" content="${url}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join("\n");
}

for (const lang of Object.keys(PAGES)) {
  const p = PAGES[lang];
  const html = template
    .replaceAll("{{LANG}}", lang)
    .replaceAll("{{ROOT}}", p.root)
    .replaceAll("{{HOME}}", p.home)
    .replaceAll("{{BASE}}", BASE)
    .replaceAll("{{PRIVACY}}", p.privacy)
    .replaceAll("{{TERMS}}", p.terms)
    .replaceAll("{{REVIEW_URL}}", attr(REVIEW_URL));

  // Run the page's scripts so the text, services and gallery are rendered into the DOM.
  const dom = new JSDOM(html, { runScripts: "dangerously", url: BASE + p.path });
  const doc = dom.window.document;
  if (!doc.querySelector("#grid .proj")) throw new Error(`${lang}: gallery did not render`);
  if (doc.querySelector("[data-t]:empty")) throw new Error(`${lang}: some text did not render`);
  if (!REVIEW_URL) doc.querySelector("[data-review]")?.remove();

  let out = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  out = out.replace("<!--SEO-->", seoHead(lang));
  mkdirSync(p.out.includes("/") ? p.out.split("/")[0] : ".", { recursive: true });
  writeFileSync(p.out, out + "\n");
  dom.window.close();
  console.log(`wrote ${p.out}`);
}

// Privacy Policy and Terms pages (English + Spanish), same look as the site.
const fontLinks = template.match(/<link rel="preconnect"[\s\S]*?display=swap" rel="stylesheet">/)[0];
const brandMark = template.match(/<span class="brand-mark"[\s\S]*?<\/span>/)[0];
const legalUrls = [];
for (const [kind, langs] of Object.entries(LEGAL)) {
  for (const [lang, page] of Object.entries(langs)) {
    const other = lang === "en" ? "es" : "en";
    const depth = page.path.split("/").filter(Boolean).length;
    const up = "../".repeat(depth);
    const home = lang === "en" ? up : up + "es/";
    const otherKind = kind === "privacy" ? "terms" : "privacy";
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(page.title)} | JAM Construction Services</title>
<meta name="description" content="${attr(page.description)}">
<link rel="canonical" href="${BASE + page.path}">
<link rel="alternate" hreflang="${lang}" href="${BASE + page.path}">
<link rel="alternate" hreflang="${other}" href="${BASE + langs[other].path}">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
${fontLinks}
<style>
  :root{--ink:#1d1f1e;--ink-2:#4a4f4c;--paper:#f6f3ee;--line:#e3ddd3;--accent:#c8641e;--deep:#23302b}
  *{box-sizing:border-box}
  body{margin:0;font-family:"Archivo",system-ui,sans-serif;color:var(--ink);background:var(--paper);line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:var(--accent)}
  header{border-bottom:1px solid var(--line);background:rgba(246,243,238,.94)}
  .bar{max-width:820px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;color:var(--ink)}
  .brand-mark{width:38px;height:38px;border-radius:10px;background:var(--deep);display:grid;place-items:center;flex:none}
  .lang{font-size:.9rem;font-weight:600;text-decoration:none}
  main{max-width:820px;margin:0 auto;padding:48px 20px 64px}
  h1{font-family:"Fraunces",Georgia,serif;font-size:clamp(2rem,5vw,2.8rem);line-height:1.1;margin:0 0 6px}
  .date{color:var(--ink-2);margin:0 0 28px;font-size:.95rem}
  h2{font-family:"Fraunces",Georgia,serif;font-size:1.35rem;margin:34px 0 8px}
  p,li{color:#2e322f}
  ul{padding-left:22px}
  footer{border-top:1px solid var(--line);color:var(--ink-2);font-size:.88rem}
  footer .bar{height:auto;padding:22px 20px;flex-wrap:wrap}
  footer a{color:var(--ink-2)}
</style>
</head>
<body>
<header><div class="bar">
  <a class="brand" href="${home}">${brandMark}<span>JAM Construction Services</span></a>
  <a class="lang" href="${up}${langs[other].path}" hreflang="${other}" lang="${other}">${other === "es" ? "Español" : "English"}</a>
</div></header>
<main>
  <h1>${page.title}</h1>
  <p class="date">${lang === "en" ? "Effective" : "Vigente desde el"} ${EFFECTIVE[lang]}</p>
  ${page.body.trim()}
</main>
<footer><div class="bar">
  <span>© ${new Date().getFullYear()} JAM Construction Services LLC</span>
  <span><a href="${home}">${lang === "en" ? "Home" : "Inicio"}</a> · <a href="${up}${LEGAL[otherKind][lang].path}">${LEGAL[otherKind][lang].title}</a></span>
</div></footer>
</body>
</html>
`;
    mkdirSync(page.path, { recursive: true });
    writeFileSync(page.path + "index.html", html);
    legalUrls.push({ loc: BASE + page.path, alts: { [lang]: BASE + page.path, [other]: BASE + langs[other].path } });
    console.log(`wrote ${page.path}index.html`);
  }
}

// Sitemap with both language versions linked to each other.
const today = new Date().toISOString().slice(0, 10);
const links = Object.entries(PAGES)
  .map(([l, q]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE + q.path}"/>`)
  .join("");
const urls = Object.values(PAGES)
  .map((p) => `<url><loc>${BASE + p.path}</loc><lastmod>${today}</lastmod>${links}</url>`)
  .join("\n");
const legalXml = legalUrls
  .map((u) => `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod>${Object.entries(u.alts).map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join("")}</url>`)
  .join("\n");
writeFileSync(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n${legalXml}\n</urlset>\n`
);
writeFileSync("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log("wrote sitemap.xml, robots.txt");
