// WhatsApp / social preview image for each personal invitation (1200x630).
import { ImageResponse } from "@vercel/og";
import { findGuest } from "./_page.js";

export const config = { runtime: "edge" };

const el = (type, style, children) => ({ type, props: { style: { display: "flex", ...style }, children } });
const txt = (style, children) => el("div", style, children);

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").toLowerCase();
  const guest = await findGuest(slug);
  const base = url.origin + "/assets/invite/og/";
  const [pinyon, m600, m800, mono] = await Promise.all([
    fetch(base + "PinyonScript-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch(base + "Manrope-600.ttf").then((r) => r.arrayBuffer()),
    fetch(base + "Manrope-800.ttf").then((r) => r.arrayBuffer()),
    fetch(url.origin + "/assets/img/logo/emblem-mono.svg").then((r) => r.text()),
  ]);
  const emblem = (color) => "data:image/svg+xml;base64," + btoa(mono.replace('fill="currentColor"', `fill="${color}"`).replace(/<title>.*?<\/title>/, ""));
  const fonts = [
    { name: "Pinyon", data: pinyon, weight: 400, style: "normal" },
    { name: "Manrope", data: m600, weight: 600, style: "normal" },
    { name: "Manrope", data: m800, weight: 800, style: "normal" },
  ];
  const name = guest ? guest[0] : "";
  const friend = guest && (guest[2] === "f" || guest[2] === "sd");

  const frame = (card) => el("div", { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#F3ECE1" }, card);

  let card;
  if (friend) {
    const size = Math.min(150, Math.floor(980 / Math.max(4, name.length * 0.72)));
    card = el("div", { position: "relative", width: 1110, height: 540, borderRadius: 34, flexDirection: "column", justifyContent: "center", padding: "0 70px",
      backgroundImage: "linear-gradient(135deg, #f6deae, #e2bc85 45%, #b88d52)", boxShadow: "0 30px 60px -30px rgba(60,40,15,.6)" }, [
      el("div", { position: "absolute", top: 18, left: 18, right: 18, bottom: 18, borderRadius: 22, border: "2px solid rgba(60,40,15,.35)" }, []),
      { type: "img", props: { src: emblem("#3a2a14"), width: 74, height: 72, style: { position: "absolute", top: 56, right: 66 } } },
      txt({ fontFamily: "Manrope", fontWeight: 600, fontSize: 26, letterSpacing: 6, color: "#3a2a14" }, "LA RAZA · SOFT LAUNCH"),
      txt({ fontFamily: "Manrope", fontWeight: 800, fontSize: size, letterSpacing: -4, color: "#1d1712", lineHeight: 1, marginTop: 18 }, name.toUpperCase() + ","),
      txt({ fontFamily: "Manrope", fontWeight: 800, fontSize: 64, letterSpacing: -2, color: "#1d1712", lineHeight: 1, marginTop: 10 }, "YOU MADE THE LIST."),
      txt({ fontFamily: "Manrope", fontWeight: 800, fontSize: 32, color: "#2a1d0e", marginTop: 34 }, "Fri 27 Nov · Doors 17:00 · Close friends only"),
    ]);
  } else {
    const size = name ? Math.min(118, Math.floor(940 / Math.max(6, name.length * 0.44))) : 0;
    card = el("div", { position: "relative", width: 1110, height: 540, borderRadius: 34, flexDirection: "column", alignItems: "center", justifyContent: "center",
      backgroundImage: "linear-gradient(160deg, #241f1a, #0e0c0a)", boxShadow: "0 30px 60px -30px rgba(40,25,10,.8)" }, [
      el("div", { position: "absolute", top: 18, left: 18, right: 18, bottom: 18, borderRadius: 22, border: "2px solid rgba(214,178,122,.42)" }, []),
      { type: "img", props: { src: emblem("#D6B27A"), width: 70, height: 68 } },
      txt({ fontFamily: "Manrope", fontWeight: 600, fontSize: 24, letterSpacing: 8, color: "#E2BC85", marginTop: 26 }, name ? "A PRIVATE PREVIEW FOR" : "LA RAZA · NEWCASTLE"),
      txt({ fontFamily: "Pinyon", fontSize: name ? size : 110, color: "#E9C78D", lineHeight: 1.25, marginTop: 6, padding: "0 30px" }, name || "A private preview"),
      el("div", { width: 130, height: 2, background: "rgba(214,178,122,.6)", marginTop: 10 }, []),
      txt({ fontFamily: "Manrope", fontWeight: 600, fontSize: 26, letterSpacing: 6, color: "rgba(247,244,239,.88)", marginTop: 30 }, "FRIDAY · 27 NOVEMBER · 17:00"),
    ]);
  }

  return new ImageResponse(frame(card), {
    width: 1200, height: 630, fonts,
    headers: { "cache-control": "public, max-age=3600, s-maxage=86400" },
  });
}
