// Opening-night sign-ups: an email address or a WhatsApp number, stored privately.
import { json, validEmail, validPhone, putJSON, exists, sha, clean } from "./_lib.js";

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: "Something went wrong. Please try again." }, 400); }
  if (body.company) return json({ ok: true }); // bots fill the hidden field

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
