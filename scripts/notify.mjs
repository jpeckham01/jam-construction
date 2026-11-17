// Sends the texts queued by process-inbox.mjs, after the site has deployed.
// NOTIFY is a JSON array of {to, body}; to is a phone number, "admin" (ADMIN_NUMBER) or "slack" (SLACK_WEBHOOK_URL).
const list = JSON.parse(process.env.NOTIFY || "[]");
const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from, ADMIN_NUMBER: admin } = process.env;

if (!list.length) process.exit(0);

// Slack: incoming webhook, posted first so it works even before Twilio texting is approved.
// Accept the bare URL or anything containing it (e.g. Slack's sample curl command pasted whole).
const slackUrl = ((process.env.SLACK_WEBHOOK_URL || "").match(/https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9\/]+/) || [""])[0];
for (const m of list.filter((m) => m.to === "slack")) {
  if (!slackUrl) { console.log("SLACK_WEBHOOK_URL not set; skipping Slack"); break; }
  const res = await fetch(slackUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: m.body }) });
  console.log(`slack: ${res.status}`);
}
if (!sid || !token || !from) { console.log("Twilio secrets not set; skipping texts:", list); process.exit(0); }

for (const m of list.filter((m) => m.to !== "slack")) {
  const to = m.to === "admin" ? admin : m.to;
  if (!to) continue;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to, Body: m.body }),
  });
  console.log(`text to ${to.slice(0, -4)}****: ${res.status}`);
}
