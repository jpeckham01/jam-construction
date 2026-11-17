// Builds the static site from src/template.html.
// Runs the page's own render code in jsdom so every word is already in the HTML Google downloads,
// and writes an English page (index.html) and a Spanish page (es/index.html) with their own titles and tags.
//
//   npm install && npm run build
//
// At the custom-domain cutover, change BASE below and add a CNAME file.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { JSDOM } from "jsdom";

const BASE = "https://jamconstructionmd.com/";
const PHONE = "(443) 901-8869";
// Google review link from Jorge's Google Business Profile ("Ask for reviews" → copy link).
// Leave empty and the review section is left out of the site.
const REVIEW_URL = process.env.REVIEW_URL ?? "";

const PAGES = {
  en: {
    out: "index.html", root: "", home: "./", path: "", locale: "en_US",
    title: "Stone Walls, Patios & Hardscaping in Baltimore County | JAM Construction",
    description: "Stone walls, stone stairs, paver patios, walkways, pool decks, fences, decks, garages and outdoor fireplaces in Baltimore County, MD. Competitive prices and free estimates. Se habla español.",
    ogTitle: "JAM Construction Services – Stone Walls, Patios & Hardscaping in Baltimore County",
    ogDescription: `Stone walls, patios, walkways, pool decks, fences, decks, garages and outdoor fireplaces. Competitive prices, free estimates – text Jorge at ${PHONE}.`,
  },
  es: {
    out: "es/index.html", root: "../", home: "../", path: "es/", locale: "es_US",
    title: "Muros de piedra, patios y paisajismo en el condado de Baltimore | JAM Construction",
    description: "Muros de piedra, escaleras de piedra, patios de adoquín, caminos, terrazas de piscina, cercas, decks, garajes y chimeneas al aire libre en el condado de Baltimore, MD. Precios competitivos y presupuestos gratis.",
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

// Sitemap with both language versions linked to each other.
const today = new Date().toISOString().slice(0, 10);
const links = Object.entries(PAGES)
  .map(([l, q]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE + q.path}"/>`)
  .join("");
const urls = Object.values(PAGES)
  .map((p) => `<url><loc>${BASE + p.path}</loc><lastmod>${today}</lastmod>${links}</url>`)
  .join("\n");
writeFileSync(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`
);
writeFileSync("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log("wrote sitemap.xml, robots.txt");
