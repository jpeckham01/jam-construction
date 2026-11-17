// Sends the texts queued by process-inbox.mjs, after the site has deployed.
// NOTIFY is a JSON array of {to, body}; to is a phone number or "admin" (ADMIN_NUMBER).
const list = JSON.parse(process.env.NOTIFY || "[]");
const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from, ADMIN_NUMBER: admin } = process.env;

if (!list.length) process.exit(0);
if (!sid || !token || !from) { console.log("Twilio secrets not set; skipping texts:", list); process.exit(0); }

for (const m of list) {
  const to = m.to === "admin" ? admin : m.to;
  if (!to) continue;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to, Body: m.body }),
  });
  console.log(`text to ${to.slice(0, -4)}****: ${res.status}`);
}
