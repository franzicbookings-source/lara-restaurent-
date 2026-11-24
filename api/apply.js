// Job applications: the form fields plus the CV file, stored privately for the hiring dashboard.
import { json, clean, cleanText, validEmail, validPhone, putJSON, putFile, newId, ROLES } from "./_lib.js";

const MAX = 4 * 1024 * 1024;
const TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heic",
};

export async function POST(request) {
  let form;
  try { form = await request.formData(); } catch {
    return json({ ok: false, error: "Your CV may be too big. Keep it under 4 MB and try again." }, 400);
  }
  if (form.get("company")) return json({ ok: true }); // bots fill the hidden field

  const name = clean(form.get("name"), 80);
  const email = validEmail(form.get("email"));
  const phone = validPhone(form.get("phone"));
  const role = ROLES.includes(form.get("role")) ? form.get("role") : "";
  const refs = cleanText(form.get("refs"), 600);
  const cv = form.get("cv");

  const missing = [];
  if (!role) missing.push("the role");
  if (name.length < 2) missing.push("your name");
  if (!email) missing.push("a valid email");
  if (!phone) missing.push("a valid WhatsApp number");
  if (!cv || typeof cv === "string" || !cv.size) missing.push("your CV");
  if (missing.length) return json({ ok: false, error: "Please add " + missing.join(", ").replace(/, ([^,]*)$/, " and $1") + "." }, 400);

  let ext = TYPES[cv.type] || (cv.name || "").split(".").pop().toLowerCase();
  if (!Object.values(TYPES).includes(ext)) return json({ ok: false, error: "Please send your CV as a PDF, Word document or photo." }, 400);
  if (cv.size > MAX) return json({ ok: false, error: "Your CV is over 4 MB. Please send a smaller file." }, 400);

  const id = newId();
  const base = (cv.name || "cv").replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 60) || "CV";
  const cvPath = `cvs/${id}/${base}.${ext}`;
  await putFile(cvPath, Buffer.from(await cv.arrayBuffer()), cv.type || "application/octet-stream");
  await putJSON(`applications/${id}.json`, {
    id, name, email, phone, role, refs,
    cv: { path: cvPath, name: `${base}.${ext}`, size: cv.size, type: cv.type || "" },
    status: "new", rating: 0, notes: [], at: new Date().toISOString(),
  }, { overwrite: false });
  return json({ ok: true });
}
