// Shared helpers for the hiring and sign-up backend: private Vercel Blob storage, the dashboard
// login (one shared password, signed session cookie) and input checks.
import { put, get, list, del } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";

// The shared dashboard password, stored only as a slow salted hash (PBKDF2-SHA256).
const ADMIN_HASH = "pbkdf2$210000$Jzyji27PZN+2O52VeBg58g==$KPdL1s7svs9oEmY5qF6xJmKgmj7aINZzMrn+/653uk0=";

export const ROLES = ["Manager", "Barman", "Hostess", "General Workers"];
export const STATUSES = ["new", "shortlisted", "interview", "hired", "declined"];

const enc = new TextEncoder();
const b64 = (u) => Buffer.from(u).toString("base64");
const b64url = (u) => Buffer.from(u).toString("base64url");

/* ---------------- storage: Vercel Blob (private), or a folder when testing locally ---------------- */
const LOCAL = process.env.LR_LOCAL_STORE;

export async function putJSON(pathname, data, { overwrite = true } = {}) {
  const body = JSON.stringify(data);
  if (LOCAL) return writeLocal(pathname, body, overwrite);
  return put(pathname, body, { access: "private", addRandomSuffix: false, allowOverwrite: overwrite, contentType: "application/json" });
}

export async function putFile(pathname, buffer, contentType) {
  if (LOCAL) return writeLocal(pathname, buffer, false);
  return put(pathname, buffer, { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType });
}

export async function getJSON(pathname) {
  if (LOCAL) {
    try { return JSON.parse(await fs.readFile(path.join(LOCAL, pathname), "utf8")); } catch { return null; }
  }
  const r = await get(pathname, { access: "private", useCache: false });
  if (!r) return null;
  return JSON.parse(await new Response(r.stream).text());
}

export async function getFile(pathname) {
  if (LOCAL) {
    try { const buf = await fs.readFile(path.join(LOCAL, pathname)); return { body: buf, type: guessType(pathname) }; } catch { return null; }
  }
  const r = await get(pathname, { access: "private", useCache: false });
  if (!r) return null;
  return { body: r.stream, type: (r.blob && r.blob.contentType) || r.headers.get("content-type") || guessType(pathname) };
}

export async function listPaths(prefix) {
  if (LOCAL) {
    const dir = path.join(LOCAL, prefix);
    try { return (await fs.readdir(dir)).map((f) => prefix + f); } catch { return []; }
  }
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) out.push(b.pathname);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

export async function remove(pathnames) {
  if (!pathnames.length) return;
  if (LOCAL) { for (const p of pathnames) await fs.rm(path.join(LOCAL, p), { force: true }); return; }
  await del(pathnames);
}

export async function exists(pathname) {
  if (LOCAL) { try { await fs.access(path.join(LOCAL, pathname)); return true; } catch { return false; } }
  try { return !!(await get(pathname, { access: "private", useCache: false })); } catch { return false; }
}

async function writeLocal(pathname, body, overwrite) {
  const f = path.join(LOCAL, pathname);
  await fs.mkdir(path.dirname(f), { recursive: true });
  if (!overwrite) { try { await fs.access(f); throw new Error("exists"); } catch (e) { if (e.message === "exists") throw e; } }
  await fs.writeFile(f, body);
  return { pathname };
}

// Read many JSON records a few at a time
export async function getMany(paths, limit = 12) {
  const out = new Array(paths.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, paths.length) }, async () => {
    while (i < paths.length) { const n = i++; try { out[n] = await getJSON(paths[n]); } catch { out[n] = null; } }
  }));
  return out.filter(Boolean);
}

/* ---------------- dashboard login ---------------- */
async function sessionKey() {
  const secret = (process.env.BLOB_READ_WRITE_TOKEN || process.env.LR_LOCAL_SECRET || "") + "|" + ADMIN_HASH;
  const raw = await crypto.subtle.digest("SHA-256", enc.encode("lr-admin-session:" + secret));
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function checkPassword(pw) {
  const [, it, salt, hash] = ADMIN_HASH.split("$");
  const key = await crypto.subtle.importKey("raw", enc.encode(String(pw || "")), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: Buffer.from(salt, "base64"), iterations: +it, hash: "SHA-256" }, key, 256));
  const want = Buffer.from(hash, "base64");
  let diff = bits.length ^ want.length;
  for (let k = 0; k < Math.min(bits.length, want.length); k++) diff |= bits[k] ^ want[k];
  return diff === 0;
}

const COOKIE = "lr_admin";
const DAYS = 14;

export async function sessionCookie() {
  const exp = String(Date.now() + DAYS * 864e5);
  const sig = b64url(new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(), enc.encode(exp))));
  return `${COOKIE}=${exp}.${sig}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DAYS * 86400}`;
}
export const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function isSignedIn(request) {
  const m = (request.headers.get("cookie") || "").match(/(?:^|;\s*)lr_admin=(\d+)\.([A-Za-z0-9_-]+)/);
  if (!m || +m[1] < Date.now()) return false;
  try {
    return await crypto.subtle.verify("HMAC", await sessionKey(), Buffer.from(m[2], "base64url"), enc.encode(m[1]));
  } catch { return false; }
}

/* ---------------- small helpers ---------------- */
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export const clean = (s, max = 200) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
export const cleanText = (s, max = 1000) => String(s ?? "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);

export function validEmail(s) {
  const v = clean(s, 120).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : "";
}

// South African numbers to +27…; other countries kept if they start with + and look complete
export function validPhone(s) {
  let d = String(s || "").replace(/[^\d+]/g, "");
  const plus = d.startsWith("+");
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (!plus && d.startsWith("0") && d.length === 10) d = "27" + d.slice(1);
  else if (!plus && d.length === 9 && /^[678]/.test(d)) d = "27" + d;
  if (d.startsWith("27") && d.length !== 11) return "";
  return d.length >= 10 && d.length <= 15 ? "+" + d : "";
}

export async function sha(s) {
  return Buffer.from(await crypto.subtle.digest("SHA-256", enc.encode(s))).toString("hex");
}

export function newId() {
  return Date.now().toString(36) + "-" + b64url(crypto.getRandomValues(new Uint8Array(6))).replace(/[-_]/g, "x");
}

function guessType(p) {
  const ext = p.split(".").pop().toLowerCase();
  return { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", json: "application/json" }[ext] || "application/octet-stream";
}

// A form posted without the page script expects a page back, not JSON
export const wantsPage = (request) => (request.headers.get("accept") || "").includes("text/html");
export const backTo = (hash, params) => new Response(null, { status: 303, headers: { location: "/?" + new URLSearchParams(params).toString() + "#" + hash, "cache-control": "no-store" } });
