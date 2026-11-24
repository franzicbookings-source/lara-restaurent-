// Hiring dashboard API (one shared password). ?action= session | login | logout | apps | update | delete | cv | subs | subs-csv
import { json, isSignedIn, checkPassword, sessionCookie, clearCookie, listPaths, getMany, getJSON, putJSON, getFile, remove, STATUSES, cleanText, clean } from "./_lib.js";

const act = (request) => new URL(request.url).searchParams.get("action") || "";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const denied = () => json({ ok: false, error: "Please sign in again." }, 401);

export async function GET(request) {
  const action = act(request);
  const url = new URL(request.url);
  if (action === "session") return json({ ok: await isSignedIn(request) });
  if (action === "health") {
    // Storage self-check: write, read back and remove one tiny file (no personal data)
    try {
      const stamp = new Date().toISOString();
      await putJSON("health/ping.json", { stamp }, { overwrite: true });
      const back = await getJSON("health/ping.json");
      await remove(["health/ping.json"]);
      return json({ ok: !!back && back.stamp === stamp });
    } catch (err) { return json({ ok: false, error: String(err && err.message || err).slice(0, 200) }, 500); }
  }
  if (!(await isSignedIn(request))) return denied();

  if (action === "apps") {
    const apps = await getMany((await listPaths("applications/")).filter((p) => p.endsWith(".json")));
    apps.sort((a, b) => (a.at < b.at ? 1 : -1));
    return json({ ok: true, apps });
  }
  if (action === "cv") {
    const app = await getJSON(`applications/${clean(url.searchParams.get("id"), 40)}.json`);
    const file = app && (await getFile(app.cv.path));
    if (!file) return json({ ok: false, error: "That CV could not be found." }, 404);
    const disp = url.searchParams.get("dl") ? "attachment" : "inline";
    const fname = `${app.name} - ${app.role} CV.${app.cv.path.split(".").pop()}`.replace(/[^A-Za-z0-9 .()-]/g, "");
    return new Response(file.body, { headers: { "content-type": file.type, "content-disposition": `${disp}; filename="${fname}"`, "cache-control": "private, no-store", "x-robots-tag": "noindex" } });
  }
  if (action === "subs" || action === "subs-csv") {
    const subs = await getMany(await listPaths("subscribers/"));
    subs.sort((a, b) => (a.at < b.at ? 1 : -1));
    if (action === "subs") return json({ ok: true, subs });
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = ["Type,Contact,Signed up"].concat(subs.map((s) => [s.via === "whatsapp" ? "WhatsApp" : "Email", s.value, s.at.slice(0, 16).replace("T", " ")].map(q).join(","))).join("\r\n");
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="La Raza sign-ups.csv"', "cache-control": "no-store" } });
  }
  return json({ ok: false, error: "Unknown request." }, 400);
}

export async function POST(request) {
  const action = act(request);
  let body = {};
  try { body = await request.json(); } catch { /* empty body */ }

  if (action === "login") {
    if (await checkPassword(body.password)) return json({ ok: true }, 200, { "set-cookie": await sessionCookie() });
    await wait(600);
    return json({ ok: false, error: "That password isn’t right." }, 401);
  }
  if (action === "logout") return json({ ok: true }, 200, { "set-cookie": clearCookie });
  if (!(await isSignedIn(request))) return denied();

  const id = clean(body.id, 40);
  const path = `applications/${id}.json`;
  const app = id && (await getJSON(path));
  if (!app) return json({ ok: false, error: "That application could not be found." }, 404);

  if (action === "update") {
    if (STATUSES.includes(body.status)) app.status = body.status;
    if (Number.isInteger(body.rating) && body.rating >= 0 && body.rating <= 5) app.rating = body.rating;
    const note = cleanText(body.note, 1000);
    if (note) app.notes.push({ text: note, by: clean(body.by, 40), at: new Date().toISOString() });
    app.updated = new Date().toISOString();
    await putJSON(path, app, { overwrite: true });
    return json({ ok: true, app });
  }
  if (action === "delete") {
    await remove([app.cv.path, path]);
    return json({ ok: true });
  }
  return json({ ok: false, error: "Unknown request." }, 400);
}
