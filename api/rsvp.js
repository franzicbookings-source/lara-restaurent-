// Who's coming: the sending page saves each guest's "sent" tick and RSVP here, so they stay put and match on every phone.
// Records are keyed by guest number only (names live in the encrypted list). One small record per change:
//   rsvp/<list>/<guest>_<time>_<yes|no|none>_<0|1>.json   (newest wins; older ones are tidied away)
import { json, listPaths, putJSON, remove, sha } from "./_lib.js";

// sha256 of the key each sending page derives from its passcode; the passcode itself never reaches the server
const LISTS = { "b826f568a96dfda74dc91d2d6e3039889ecfc34045b3e348699628d9ad03cc5a": "main" };

async function listOf(request) {
  const k = request.headers.get("x-lr-key") || "";
  return /^[a-f0-9]{64}$/.test(k) ? LISTS[await sha(k)] || null : null;
}
const parse = (p) => { const m = p.match(/\/(\d{1,4})_(\d{13})_(yes|no|none)_([01])\.json$/); return m && { no: +m[1], t: +m[2], r: m[3] === "none" ? "" : m[3], s: +m[4], p }; };

async function current(list) {
  const out = {};
  for (const rec of (await listPaths(`rsvp/${list}/`)).map(parse).filter(Boolean)) if (!out[rec.no] || out[rec.no].t < rec.t) out[rec.no] = rec;
  return out;
}

export async function GET(request) {
  const list = await listOf(request);
  if (!list) return json({ ok: false, error: "Not allowed" }, 401);
  const cur = await current(list);
  return json({ ok: true, list: Object.fromEntries(Object.values(cur).map(({ no, r, s, t }) => [no, { r, s, t }])) });
}

export async function POST(request) {
  const list = await listOf(request);
  if (!list) return json({ ok: false, error: "Not allowed" }, 401);
  let b; try { b = await request.json(); } catch { return json({ ok: false, error: "Bad request" }, 400); }
  const no = Number(b.no), r = b.r === "yes" || b.r === "no" ? b.r : "", s = b.s ? 1 : 0;
  if (!Number.isInteger(no) || no < 1 || no > 9999) return json({ ok: false, error: "Bad guest" }, 400);
  const t = Date.now();
  const p = `rsvp/${list}/${no}_${t}_${r || "none"}_${s}.json`;
  await putJSON(p, { no, r, s, t });
  // keep only the newest record for this guest
  const old = (await listPaths(`rsvp/${list}/`)).map(parse).filter((x) => x && x.no === no && x.t < t).map((x) => x.p);
  if (old.length) await remove(old).catch(() => {});
  return json({ ok: true, t });
}
