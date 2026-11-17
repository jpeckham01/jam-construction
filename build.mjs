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
import { SERVICE_PAGES, TOWNS, servicePath } from "./src/services.mjs";

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
// The gallery is capped at 3 pages of 12 (scripts/process-inbox.mjs archives older jobs); this is a safety net.
const GALLERY_MAX = 36;
const ordered = [...jobs.filter((j) => j.featured), ...jobs.filter((j) => !j.featured)].slice(0, GALLERY_MAX);
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

// One page per service, English + Spanish (content in src/services.mjs).
const serviceUrls = [];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const UI = {
  en: { home: "Home", services: "Services", recent: "Recent jobs", what: "What we do", areas: "Where we work", areasP: `Across Baltimore County, including ${TOWNS.join(", ")}.`,
        how: "How to get a free estimate", howP: "Text Jorge a few photos of the area and a short description of what you need. He'll get back to you to talk it over and give you a free estimate. Se habla español.",
        text: "Text Jorge", textSub: "Send photos and a description", email: "Email Jorge", call: "Call", others: "Other services", seeAll: "See all our work →",
        smsBody: "Hi Jorge, I found you on your website. I'd like a free estimate for: ", mailSubject: "Free estimate request", other: "Español", privacy: "Privacy", terms: "Terms" },
  es: { home: "Inicio", services: "Servicios", recent: "Trabajos recientes", what: "Lo que hacemos", areas: "Dónde trabajamos", areasP: `En todo el condado de Baltimore, incluyendo ${TOWNS.join(", ")}.`,
        how: "Cómo pedir un presupuesto gratis", howP: "Mande a Jorge unas fotos del área y una breve descripción de lo que necesita. Él le responde para hablar del proyecto y darle un presupuesto gratis. We speak English too.",
        text: "Envíe un texto a Jorge", textSub: "Mande fotos y una descripción", email: "Correo a Jorge", call: "Llamar", others: "Otros servicios", seeAll: "Ver todo nuestro trabajo →",
        smsBody: "Hola Jorge, lo encontré en su página web. Quisiera un presupuesto gratis para: ", mailSubject: "Solicitud de presupuesto gratis", other: "English", privacy: "Privacidad", terms: "Términos" },
};
for (const svc of SERVICE_PAGES) {
  for (const lang of ["en", "es"]) {
    const t = svc[lang], ui = UI[lang], other = lang === "en" ? "es" : "en";
    const path = servicePath(lang, t.slug), otherPath = servicePath(other, svc[other].slug);
    const up = "../".repeat(path.split("/").filter(Boolean).length);
    const home = lang === "en" ? up : up + "es/";
    const catJobs = ordered.filter((j) => j.c === svc.c && j.photos.length).slice(0, 6);
    const ogImage = BASE + (catJobs[0]?.photos[0] || "photos/stone-wall-1.jpg");
    const gallery = catJobs.length ? `
  <h2>${ui.recent}</h2>
  <div class="gal">${catJobs.map((j) => `
    <figure><img src="${up}${j.photos[0]}" alt="${attr((j.alts?.[lang]?.[0]) || j.title[lang])}" loading="lazy"><figcaption>${esc(j.title[lang])}${j.loc ? ` <span>· ${esc(j.loc)}</span>` : ""}</figcaption></figure>`).join("")}
  </div>
  <p><a href="${home}#work">${ui.seeAll}</a></p>` : "";
    const others = SERVICE_PAGES.filter((o) => o !== svc).map((o) => `<a href="${up}${servicePath(lang, o[lang].slug)}">${esc(o[lang].name)}</a>`).join("");
    const ld = [
      { "@context": "https://schema.org", "@type": "Service", name: t.name, serviceType: t.name, description: t.description, url: BASE + path, inLanguage: lang,
        provider: { "@type": "HomeAndConstructionBusiness", name: "JAM Construction Services LLC", url: BASE, telephone: "+1-443-901-8869", email: "jorge@jamconstructionmd.com" },
        areaServed: [{ "@type": "AdministrativeArea", name: "Baltimore County, MD" }, ...TOWNS.map((n) => ({ "@type": "City", name: `${n}, MD` }))] },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: ui.home, item: BASE + (lang === "en" ? "" : "es/") },
        { "@type": "ListItem", position: 2, name: t.name, item: BASE + path } ] },
    ];
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(t.title)}</title>
<meta name="description" content="${attr(t.description)}">
<link rel="canonical" href="${BASE + path}">
<link rel="alternate" hreflang="${lang}" href="${BASE + path}">
<link rel="alternate" hreflang="${other}" href="${BASE + otherPath}">
<link rel="alternate" hreflang="x-default" href="${BASE + servicePath("en", svc.en.slug)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="JAM Construction Services">
<meta property="og:locale" content="${PAGES[lang].locale}">
<meta property="og:title" content="${attr(t.title)}">
<meta property="og:description" content="${attr(t.description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${BASE + path}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
${fontLinks}
<style>
  :root{--ink:#1d1f1e;--ink-2:#4a4f4c;--paper:#f6f3ee;--line:#e3ddd3;--accent:#c8641e;--accent-dk:#a85215;--deep:#23302b}
  *{box-sizing:border-box}
  body{margin:0;font-family:"Archivo",system-ui,sans-serif;color:var(--ink);background:var(--paper);line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:var(--accent)}
  header{border-bottom:1px solid var(--line);background:rgba(246,243,238,.94)}
  .bar{max-width:960px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;color:var(--ink)}
  .brand-mark{width:38px;height:38px;border-radius:10px;background:var(--deep);display:grid;place-items:center;flex:none}
  .lang{font-size:.9rem;font-weight:600;text-decoration:none}
  main{max-width:960px;margin:0 auto;padding:36px 20px 64px}
  .crumbs{font-size:.88rem;color:var(--ink-2);margin:0 0 14px}
  .crumbs a{color:var(--ink-2)}
  h1{font-family:"Fraunces",Georgia,serif;font-size:clamp(2rem,5vw,3rem);line-height:1.1;margin:0 0 16px}
  h2{font-family:"Fraunces",Georgia,serif;font-size:1.5rem;margin:40px 0 12px}
  p,li{color:#2e322f;font-size:1.05rem}
  .lead{max-width:720px}
  ul.ticks{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px 20px}
  ul.ticks li{position:relative;padding-left:26px}
  ul.ticks li::before{content:"";position:absolute;left:2px;top:.5em;width:12px;height:7px;border-left:2.5px solid var(--accent);border-bottom:2.5px solid var(--accent);transform:rotate(-45deg)}
  .ctas{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0 6px}
  .btn{display:inline-flex;flex-direction:column;padding:14px 20px;border-radius:14px;text-decoration:none;font-weight:700;color:#fff;background:var(--accent)}
  .btn small{font-weight:400;opacity:.9;font-size:.85rem}
  .btn:hover{background:var(--accent-dk)}
  .btn.alt{background:var(--deep)}
  .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
  .gal figure{margin:0;background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .gal img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
  .gal figcaption{padding:10px 14px;font-weight:600;font-size:.95rem}
  .gal figcaption span{font-weight:400;color:var(--ink-2)}
  .box{background:var(--deep);color:#fff;border-radius:18px;padding:26px;margin-top:40px}
  .box h2{color:#fff;margin-top:0}
  .box p{color:#d6ddd9}
  .others{display:flex;flex-wrap:wrap;gap:10px}
  .others a{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;text-decoration:none;color:var(--ink);font-size:.95rem}
  footer{border-top:1px solid var(--line);color:var(--ink-2);font-size:.88rem}
  footer .bar{height:auto;padding:22px 20px;flex-wrap:wrap}
  footer a{color:var(--ink-2)}
</style>
</head>
<body>
<header><div class="bar">
  <a class="brand" href="${home}">${brandMark}<span>JAM Construction Services</span></a>
  <a class="lang" href="${up}${otherPath}" hreflang="${other}" lang="${other}">${ui.other}</a>
</div></header>
<main>
  <p class="crumbs"><a href="${home}">${ui.home}</a> › <a href="${home}#services">${ui.services}</a> › ${esc(t.name)}</p>
  <h1>${esc(t.h1)}</h1>
  <div class="lead">${t.intro.map((x) => `<p>${esc(x)}</p>`).join("")}</div>
  <div class="ctas">
    <a class="btn" href="sms:+14439018869?&body=${encodeURIComponent(ui.smsBody)}">${ui.text}<small>${ui.textSub}</small></a>
    <a class="btn alt" href="tel:+14439018869">${ui.call}<small>${PHONE}</small></a>
    <a class="btn alt" href="mailto:jorge@jamconstructionmd.com?subject=${encodeURIComponent(ui.mailSubject)}">${ui.email}<small>jorge@jamconstructionmd.com</small></a>
  </div>
  <h2>${ui.what}</h2>
  <ul class="ticks">${t.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
  ${gallery}
  <h2>${ui.areas}</h2>
  <p>${ui.areasP}</p>
  <div class="box">
    <h2>${ui.how}</h2>
    <p>${ui.howP}</p>
    <div class="ctas"><a class="btn" href="sms:+14439018869?&body=${encodeURIComponent(ui.smsBody)}">${ui.text}<small>${PHONE}</small></a></div>
  </div>
  <h2>${ui.others}</h2>
  <div class="others">${others}</div>
</main>
<footer><div class="bar">
  <span>© ${new Date().getFullYear()} JAM Construction Services LLC · <a href="tel:+14439018869">${PHONE}</a></span>
  <span><a href="${home}">${ui.home}</a> · <a href="${up}${LEGAL.privacy[lang].path}">${ui.privacy}</a> · <a href="${up}${LEGAL.terms[lang].path}">${ui.terms}</a></span>
</div></footer>
</body>
</html>
`;
    mkdirSync(path, { recursive: true });
    writeFileSync(path + "index.html", html);
    serviceUrls.push({ loc: BASE + path, alts: { [lang]: BASE + path, [other]: BASE + otherPath } });
  }
}
console.log(`wrote ${serviceUrls.length} service pages`);

// Sitemap with both language versions linked to each other.
const today = new Date().toISOString().slice(0, 10);
const links = Object.entries(PAGES)
  .map(([l, q]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${BASE + q.path}"/>`)
  .join("");
const urls = Object.values(PAGES)
  .map((p) => `<url><loc>${BASE + p.path}</loc><lastmod>${today}</lastmod>${links}</url>`)
  .join("\n");
const legalXml = [...serviceUrls, ...legalUrls]
  .map((u) => `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod>${Object.entries(u.alts).map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${h}"/>`).join("")}</url>`)
  .join("\n");
writeFileSync(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n${legalXml}\n</urlset>\n`
);
writeFileSync("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log("wrote sitemap.xml, robots.txt");
