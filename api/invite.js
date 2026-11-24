import { page, notFound, findGuest } from "./_page.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  const guest = await findGuest(slug);
  const html = guest ? page(slug, guest, url.origin) : notFound(url.origin);
  return new Response(html, {
    status: guest ? 200 : 404,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}
