// JAM Construction – text-to-website Worker (Cloudflare Workers, free plan).
//
// Twilio posts every text Jorge sends to the site number here (POST /sms).
//  - Only numbers in ALLOWED_NUMBERS are accepted; everything else gets an empty reply.
//  - Every request must carry a valid X-Twilio-Signature (signed with TWILIO_AUTH_TOKEN).
//  - Each text is saved on its own in KV (no read-modify-write, so photos that arrive at the
//    same moment can't overwrite each other). Photos are downloaded from Twilio right away.
//  - Photos are posted automatically: a cron run every 2 minutes groups a sender's texts into one
//    job once he has been quiet for 3 minutes (so photos sent together stay together) and commits it
//    to the GitHub repo under inbox/<id>/. LISTO still works to post right away.
//    The repo's GitHub Action then strips GPS, resizes, writes the bilingual entry and publishes.
//  - BORRAR (not advertised to Jorge; meant for the admin) takes down the newest texted-in job.
//
// Bindings (wrangler.toml / dashboard):
//   KV namespace  DRAFTS
//   vars          ALLOWED_NUMBERS (comma-separated, E.164), GITHUB_REPO, TWILIO_ACCOUNT_SID
//   secrets       TWILIO_AUTH_TOKEN, GITHUB_TOKEN (fine-grained, Contents: read & write on the repo only)

const IDLE_MS = 3 * 60 * 1000;    // post a job after 3 quiet minutes
const LISTO_GRACE_MS = 60 * 1000; // after LISTO, wait a minute for stragglers (KV lists lag a little)
const IMAGE_EXT = { "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };

const MSG = {
  welcome: "Recibido ✅ Lo publicamos en la página en unos minutos. Si quiere, mande una nota corta: qué trabajo es y en qué ciudad.",
  listo: "Perfecto 👍 Lo publicamos en un momento.",
  borrar: "Recibido. Quitamos la última publicación en unos minutos.",
  video: "Por ahora la página solo acepta fotos 📷, no videos.",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/sms") return new Response("JAM Construction text line", { status: 200 });

    const form = await request.formData();
    const params = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    if (!(await validTwilioSignature(env.TWILIO_AUTH_TOKEN, request.url, params, request.headers.get("X-Twilio-Signature")))) {
      return new Response("Forbidden", { status: 403 });
    }

    const from = params.From || "";
    const allowed = (env.ALLOWED_NUMBERS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!allowed.includes(from)) return twiml(); // ignore everyone else, silently

    const body = (params.Body || "").trim();
    const word = body.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    if (word === "BORRAR") {
      await commitToRepo(env, `inbox/${jobId(Date.now())}-borrar/note.json`, { command: "delete-last", from, receivedAt: new Date().toISOString() });
      return twiml(MSG.borrar);
    }

    // Save the photos from this text.
    const now = Date.now();
    const sid = params.MessageSid || crypto.randomUUID();
    const media = [];
    let sawVideo = false;
    for (let i = 0; i < Number(params.NumMedia || 0); i++) {
      const type = (params[`MediaContentType${i}`] || "").toLowerCase();
      if (!IMAGE_EXT[type]) { if (type.startsWith("video/")) sawVideo = true; continue; }
      const res = await fetch(params[`MediaUrl${i}`], { headers: { Authorization: basicAuth(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN) } });
      if (!res.ok) continue;
      const key = `media:${sid}:${i}`;
      await env.DRAFTS.put(key, await res.arrayBuffer(), { expirationTtl: 7 * 86400 });
      media.push({ key, type });
    }

    const isListo = word === "LISTO";
    await env.DRAFTS.put(`msg:${from}:${String(now).padStart(15, "0")}:${sid}`,
      JSON.stringify({ at: now, body: isListo ? "" : body, media, listo: isListo }), { expirationTtl: 7 * 86400 });

    if (sawVideo && !media.length) return twiml(MSG.video);
    if (isListo) return twiml(MSG.listo);
    // Welcome text once per job (seen-key lasts as long as a job can stay open).
    const seenKey = `seen:${from}`;
    if (!(await env.DRAFTS.get(seenKey))) {
      await env.DRAFTS.put(seenKey, "1", { expirationTtl: 30 * 60 });
      return twiml(MSG.welcome);
    }
    return twiml();
  },

  // Every 2 minutes: post any job whose sender has gone quiet.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(finishReadyJobs(env));
  },
};

export async function finishReadyJobs(env, now = Date.now()) {
  const keys = [];
  let cursor;
  do {
    const page = await env.DRAFTS.list({ prefix: "msg:", cursor });
    keys.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const bySender = {};
  for (const k of keys) (bySender[k.split(":")[1]] ||= []).push(k);

  for (const [from, senderKeys] of Object.entries(bySender)) {
    const msgs = [];
    for (const k of senderKeys.sort()) {
      const m = await env.DRAFTS.get(k, "json");
      if (m) msgs.push({ key: k, ...m });
    }
    if (!msgs.length) continue;
    const last = Math.max(...msgs.map((m) => m.at));
    const listoAt = Math.max(0, ...msgs.filter((m) => m.listo).map((m) => m.at));
    const ready = (listoAt && now - listoAt >= LISTO_GRACE_MS) || now - last >= IDLE_MS;
    if (!ready) continue;

    const texts = msgs.map((m) => m.body).filter(Boolean);
    const media = msgs.flatMap((m) => m.media);
    if (media.length) {
      const id = jobId(msgs[0].at);
      const files = {};
      const list = [];
      for (const [n, m] of media.entries()) {
        const bytes = await env.DRAFTS.get(m.key, "arrayBuffer");
        if (!bytes) continue;
        const file = `${n + 1}.${IMAGE_EXT[m.type]}`;
        files[`inbox/${id}/${file}`] = bytes;
        list.push({ file, type: m.type });
      }
      files[`inbox/${id}/note.json`] = { id, from, receivedAt: new Date(msgs[0].at).toISOString(), texts, media: list };
      await commitFiles(env, files, `New job from text (${list.length} photo${list.length === 1 ? "" : "s"})`);
    }
    // Clean up (also drops text-only conversations with no photos).
    for (const m of msgs) {
      await env.DRAFTS.delete(m.key);
      for (const md of m.media) await env.DRAFTS.delete(md.key);
    }
    await env.DRAFTS.delete(`seen:${from}`);
  }
}

// ---------- helpers ----------

function twiml(message) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${esc(message)}</Message>` : ""}</Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}

function basicAuth(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}

function jobId(ms) {
  // 20261117-031502 (UTC) – sorts in time order, safe in file names
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
}

// Twilio request validation: HMAC-SHA1 over the full URL + each POST param (sorted by name) as name+value.
export async function validTwilioSignature(authToken, url, params, signature) {
  if (!authToken || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
  const expected = btoa(String.fromCharCode(...mac));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

function toBase64(bytes) {
  const u8 = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}

async function gh(env, method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "jam-sms-worker",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw Object.assign(new Error(`GitHub ${method} ${path}: ${res.status} ${await res.text()}`), { status: res.status });
  return res.json();
}

function commitToRepo(env, path, json) {
  return commitFiles(env, { [path]: json }, "Remove last texted-in job (BORRAR)");
}

// One commit on main with all files (JSON objects are written as pretty JSON, ArrayBuffers as binary).
async function commitFiles(env, files, message) {
  const blobs = [];
  for (const [path, content] of Object.entries(files)) {
    const isBinary = content instanceof ArrayBuffer;
    const blob = await gh(env, "POST", "/git/blobs", isBinary
      ? { content: toBase64(content), encoding: "base64" }
      : { content: JSON.stringify(content, null, 2) + "\n", encoding: "utf-8" });
    blobs.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await gh(env, "GET", "/git/ref/heads/main");
    const parent = await gh(env, "GET", `/git/commits/${ref.object.sha}`);
    const tree = await gh(env, "POST", "/git/trees", { base_tree: parent.tree.sha, tree: blobs });
    const commit = await gh(env, "POST", "/git/commits", { message, tree: tree.sha, parents: [ref.object.sha] });
    try {
      await gh(env, "PATCH", "/git/refs/heads/main", { sha: commit.sha });
      return commit.sha;
    } catch (e) {
      if (e.status !== 422) throw e; // 422 = main moved on meanwhile; rebuild on top of it
    }
  }
  throw new Error("Could not update main after 3 tries");
}
