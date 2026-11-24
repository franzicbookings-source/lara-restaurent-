// Opening-night sign-ups: an email address or a WhatsApp number, stored privately.
import { json as sendJSON, validEmail, validPhone, putJSON, exists, sha, clean, wantsPage, backTo } from "./_lib.js";

export async function POST(request) {
  const page = wantsPage(request);
  const json = (d, status) => (page ? backTo("waitlist-form", d.ok ? { subscribed: "1" } : { subscribe_error: d.error }) : sendJSON(d, status));
  let body = {};
  try {
    if ((request.headers.get("content-type") || "").includes("json")) body = await request.json();
    else { const f = await request.formData(); body = { value: f.get("contact"), company: f.get("company"), from: "home" }; }
  } catch { return json({ ok: false, error: "Something went wrong. Please try again." }, 400); }
  if (body.company) return json({ ok: true }); // bots fill the hidden field
  if (!body.via) body.via = String(body.value || "").includes("@") ? "email" : "whatsapp";

  const via = body.via === "whatsapp" ? "whatsapp" : "email";
  const value = via === "email" ? validEmail(body.value) : validPhone(body.value);
  if (!value) {
    return json({ ok: false, error: via === "email" ? "That email doesn’t look right. Check it and try again." : "That number doesn’t look right. Try it like 082 123 4567." }, 400);
  }

  const id = (await sha(via + ":" + value)).slice(0, 32);
  const pathname = `subscribers/${id}.json`;
  if (await exists(pathname)) return json({ ok: true, already: true });
  await putJSON(pathname, { id, via, value, at: new Date().toISOString(), from: clean(body.from || "home", 40) }, { overwrite: true });
  return json({ ok: true });
}
