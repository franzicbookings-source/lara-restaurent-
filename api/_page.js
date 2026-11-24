// Personal invitation page for the La Raza soft launch. Guests are looked up in ./_guests.js, where each
// entry is encrypted with a key derived from that guest's own link, so the repository holds no readable names.
import DATA from "./_guests.js";

export const EVENT = {
  iso: "2026-11-27T17:00:00+02:00",
  rsvpBy: "Wednesday 25 November",
  phoneIntl: "27664079896",
  phone: "066 407 9896",
};

const enc = new TextEncoder();
const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

// slug -> [name, guest number, "v" (business) | "f" (friend) | "sd" (friend invited by Sphe D)], or null
export async function findGuest(slug) {
  if (!slug || slug.length > 80) return null;
  const blob = DATA[hex(await crypto.subtle.digest("SHA-256", enc.encode(slug))).slice(0, 32)];
  if (!blob) return null;
  try {
    const raw = Uint8Array.from(atob(blob), (ch) => ch.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", enc.encode("lr-invite:" + slug)), "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, key, raw.slice(12));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch { return null; }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const wa = (text) => `https://wa.me/${EVENT.phoneIntl}?text=${encodeURIComponent(text)}`;

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g-gold" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#EAC386"/><stop offset=".5" stop-color="#CCA46C"/><stop offset="1" stop-color="#9C794C"/></linearGradient><radialGradient id="g-wax" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#4b4642"/><stop offset=".42" stop-color="#1e1c1a"/><stop offset="1" stop-color="#0a0908"/></radialGradient><radialGradient id="g-wax-in" cx="50%" cy="46%" r="52%"><stop offset=".62" stop-color="#141210"/><stop offset="1" stop-color="#2e2a27"/></radialGradient><filter id="f-seal-sh" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.6"/></filter><symbol id="sym-emblem" viewBox="0 0 1206 1170"><g transform="translate(0,1170) scale(0.100000,-0.100000)"><path d="M1594 11511 c-37 -23 -46 -47 -73 -191 -40 -219 -46 -292 -46 -560 0 -285 12 -401 61 -610 30 -126 47 -180 87 -280 132 -329 317 -587 581 -808 77 -64 260 -193 306 -215 8 -4 42 -23 75 -43 214 -125 484 -228 935 -358 230 -66 450 -132 490 -149 14 -5 39 -13 55 -17 17 -5 55 -18 85 -30 30 -11 84 -31 120 -44 259 -93 521 -234 735 -394 204 -153 330 -275 468 -451 23 -30 47 -56 53 -58 6 -2 21 5 34 15 21 17 24 28 23 84 0 36 -7 87 -16 114 -8 27 -22 78 -32 114 -10 36 -23 83 -30 105 -7 22 -23 76 -35 120 -63 228 -232 707 -317 895 -98 218 -265 518 -382 685 -146 209 -434 510 -626 656 -130 99 -297 211 -411 277 -83 47 -347 182 -358 182 -2 0 -52 23 -110 50 -58 28 -108 50 -111 50 -3 0 -35 14 -72 31 -172 79 -193 89 -198 89 -16 0 -479 225 -579 282 -197 112 -380 243 -536 387 -99 91 -128 102 -176 72z M10534 11517 c-12 -6 -64 -50 -116 -97 -246 -222 -438 -349 -709 -471 -63 -28 -136 -61 -164 -74 -187 -86 -210 -97 -380 -175 -54 -25 -139 -64 -265 -120 -212 -96 -245 -113 -465 -235 -116 -65 -358 -238 -488 -348 -84 -72 -283 -275 -386 -395 -121 -142 -217 -285 -363 -542 -65 -115 -170 -333 -233 -485 -20 -49 -43 -103 -51 -120 -14 -32 -123 -365 -148 -455 -15 -55 -62 -217 -93 -320 -37 -128 -46 -157 -59 -195 -8 -23 -14 -64 -14 -92 0 -46 3 -54 29 -72 16 -12 31 -21 34 -21 3 0 42 46 88 103 225 276 528 510 859 665 83 38 291 125 350 145 25 9 70 26 100 37 30 12 69 25 85 30 17 4 41 12 55 18 35 14 279 89 345 105 62 15 348 101 460 137 469 152 814 346 1095 617 167 159 293 331 400 541 124 243 180 455 215 801 25 248 14 542 -29 796 -26 149 -38 185 -69 211 -32 27 -52 30 -83 11z M867 9792 c-54 -60 18 -358 157 -647 217 -450 558 -855 933 -1104 51 -34 101 -65 110 -68 10 -4 34 -16 53 -28 45 -27 240 -109 305 -128 233 -68 286 -72 795 -57 613 18 852 11 1150 -36 209 -33 456 -98 632 -168 113 -45 146 -47 122 -8 -29 49 -373 280 -544 366 -140 70 -331 140 -527 191 -76 20 -172 46 -213 57 -41 11 -91 23 -110 27 -19 5 -71 19 -115 31 -44 12 -89 24 -100 27 -11 2 -45 11 -75 19 -30 9 -80 22 -110 30 -589 159 -877 285 -1189 524 -299 228 -548 542 -681 860 -44 104 -43 103 -124 90 -75 -14 -235 0 -308 26 -59 21 -141 19 -161 -4z M11215 9799 c-109 -34 -334 -51 -376 -28 -30 16 -62 -10 -84 -68 -87 -235 -338 -581 -560 -771 -345 -297 -658 -461 -1105 -577 -36 -10 -85 -23 -110 -30 -25 -7 -74 -20 -110 -29 -36 -10 -87 -23 -115 -31 -27 -8 -59 -16 -70 -18 -11 -3 -56 -15 -100 -27 -44 -12 -145 -39 -225 -60 -525 -136 -880 -294 -1165 -515 -90 -70 -121 -102 -111 -112 4 -4 68 14 144 39 272 92 503 143 757 168 289 29 388 30 845 14 250 -9 496 -13 545 -9 473 33 868 227 1247 611 167 169 280 318 450 592 121 195 264 572 275 729 6 78 5 82 -20 107 -28 27 -59 32 -112 15z M6115 8675 c-164 -40 -280 -155 -341 -335 -28 -81 -26 -298 3 -395 93 -311 93 -319 17 -420 -35 -46 -82 -145 -105 -220 -27 -87 -30 -274 -7 -350 9 -28 23 -77 32 -110 20 -77 81 -291 107 -375 82 -271 131 -532 159 -840 6 -69 16 -140 21 -157 21 -67 93 -93 149 -53 34 24 46 72 55 220 21 327 102 698 238 1095 69 200 72 218 72 380 0 141 -2 154 -28 222 -37 94 -77 153 -236 353 -167 209 -211 300 -211 436 0 179 86 294 221 294 64 0 115 -34 154 -103 56 -100 141 -113 196 -31 58 88 -27 275 -158 347 -97 52 -231 69 -338 42z M3120 7529 c-514 -26 -760 -53 -1075 -119 -22 -5 -76 -18 -120 -30 -44 -12 -93 -26 -110 -30 -54 -14 -309 -102 -364 -126 -29 -13 -57 -24 -62 -24 -4 0 -38 -14 -76 -31 -37 -17 -81 -37 -98 -44 -307 -137 -615 -297 -1008 -523 -134 -77 -141 -133 -30 -269 19 -24 120 -119 226 -212 106 -93 217 -195 248 -227 32 -33 176 -208 322 -391 146 -183 287 -353 314 -378 57 -54 188 -120 258 -130 257 -37 524 66 820 316 105 88 658 597 900 829 140 133 250 230 368 324 416 330 785 530 1124 606 115 27 321 36 438 21 93 -13 223 -44 258 -62 56 -30 40 52 -25 125 -109 125 -346 245 -573 291 -353 72 -1184 112 -1735 84z M8130 7524 c-198 -8 -587 -46 -720 -70 -187 -35 -287 -66 -420 -132 -77 -38 -110 -62 -176 -127 -81 -81 -121 -142 -104 -159 6 -6 38 -1 82 12 126 36 198 46 353 45 171 0 291 -21 465 -79 94 -32 362 -157 432 -202 15 -9 57 -36 95 -58 175 -107 465 -327 638 -485 159 -145 447 -415 660 -619 462 -443 668 -588 934 -657 100 -26 237 -21 329 10 126 44 207 110 354 293 31 38 93 114 138 169 44 55 125 154 178 220 53 66 138 158 187 204 50 47 162 152 250 234 88 83 181 173 208 200 l47 50 0 88 c0 102 20 82 -195 194 -82 44 -175 93 -207 109 -452 245 -677 356 -923 455 -11 5 -37 16 -58 25 -21 9 -44 16 -52 16 -8 0 -29 6 -47 14 -39 16 -92 35 -133 46 -16 5 -55 16 -85 25 -293 87 -600 136 -1030 165 -151 11 -1031 21 -1200 14z M5025 6943 c-183 -40 -196 -44 -349 -108 -383 -159 -801 -477 -1416 -1080 -369 -362 -602 -581 -758 -714 -73 -62 -139 -126 -147 -142 -44 -85 5 -165 220 -360 168 -151 363 -289 561 -398 320 -175 519 -239 617 -197 51 22 73 53 143 211 36 83 79 178 95 213 16 35 29 65 29 67 0 3 15 37 34 77 18 40 47 102 64 138 16 36 48 105 71 153 22 49 41 90 41 92 0 2 15 36 34 77 18 40 57 127 86 193 44 103 126 264 206 410 13 22 34 60 47 85 14 25 34 61 45 80 11 19 30 53 42 75 82 149 275 409 393 528 127 129 307 254 429 298 32 12 62 27 68 34 10 12 -18 117 -50 187 -13 26 -66 52 -165 77 -38 10 -299 13 -340 4z M6845 6935 c-105 -19 -172 -44 -189 -70 -24 -36 -57 -145 -54 -174 3 -22 15 -31 84 -61 292 -127 484 -315 770 -755 167 -257 228 -375 409 -790 98 -224 125 -285 171 -383 19 -40 34 -74 34 -77 0 -2 20 -46 43 -97 24 -51 86 -190 138 -308 70 -159 103 -224 130 -251 57 -57 125 -60 278 -9 359 120 719 350 1038 666 108 106 142 161 143 225 0 45 -6 52 -155 180 -66 56 -156 136 -200 178 -44 42 -165 157 -270 256 -104 99 -273 262 -375 361 -281 276 -503 473 -707 626 -103 79 -282 201 -348 238 -109 62 -219 120 -227 120 -5 0 -19 5 -31 12 -28 16 -71 32 -181 69 -169 55 -351 72 -501 44z M5539 6517 c-220 -183 -424 -486 -704 -1047 -200 -400 -289 -596 -485 -1055 -72 -170 -142 -334 -156 -363 -13 -29 -24 -57 -24 -63 0 -6 -6 -23 -13 -37 -8 -15 -21 -43 -29 -62 -8 -19 -20 -46 -26 -60 -71 -163 -168 -405 -388 -965 -31 -77 -69 -174 -86 -215 -16 -41 -36 -92 -44 -112 -8 -21 -21 -55 -29 -75 -15 -40 -44 -123 -156 -452 -63 -187 -69 -211 -69 -285 1 -117 28 -172 125 -256 28 -23 75 -65 105 -94 88 -82 171 -153 596 -507 221 -184 464 -386 539 -449 192 -160 189 -158 252 -196 102 -61 186 -41 217 54 8 26 24 117 35 202 12 85 26 187 31 225 32 222 88 783 135 1335 30 361 35 420 50 610 8 107 22 276 30 375 8 99 17 216 20 260 3 44 9 127 15 185 5 58 17 191 25 295 15 182 28 341 60 710 8 94 17 208 20 255 3 47 7 99 10 115 2 17 7 71 10 120 16 247 62 552 133 890 46 224 49 258 23 354 -26 97 -66 212 -93 271 -11 24 -24 55 -29 67 -5 13 -14 23 -22 23 -7 0 -42 -24 -78 -53z M6546 6548 c-3 -7 -16 -44 -30 -83 -14 -38 -46 -132 -72 -208 -54 -160 -53 -145 -1 -402 84 -414 121 -708 172 -1370 8 -110 22 -279 30 -375 8 -96 22 -265 30 -375 9 -110 22 -276 30 -370 8 -93 19 -237 25 -320 6 -82 15 -202 20 -265 5 -63 14 -185 20 -270 6 -85 15 -204 20 -265 5 -60 17 -195 25 -300 40 -498 99 -1052 150 -1415 9 -63 20 -145 25 -182 16 -113 54 -158 134 -158 78 0 68 -7 705 525 113 93 245 204 295 245 572 470 636 526 675 599 40 75 51 143 40 234 -10 76 -100 358 -186 582 -18 47 -40 107 -58 155 -7 19 -27 71 -45 115 -18 44 -38 96 -45 115 -7 19 -27 69 -44 110 -16 41 -82 208 -147 370 -111 283 -170 428 -200 497 -8 18 -21 47 -28 65 -8 18 -20 47 -27 63 -7 17 -18 44 -24 60 -16 41 -281 667 -305 719 -10 22 -32 72 -49 109 -17 38 -31 70 -31 72 0 2 -23 53 -51 112 -28 59 -65 137 -81 173 -17 36 -58 121 -91 190 -33 69 -81 170 -108 225 -152 318 -401 710 -553 874 -54 58 -184 161 -202 161 -8 0 -16 -6 -18 -12z"/></g></symbol><symbol id="sym-seal" viewBox="0 0 100 100"><ellipse cx="51" cy="54.5" rx="44" ry="43" fill="#000" fill-opacity=".45" filter="url(#f-seal-sh)"/><path d="M97.01 50.00C97.03 51.75 96.96 53.54 96.61 55.25C96.26 56.96 95.46 58.60 94.93 60.25C94.39 61.91 94.06 63.61 93.38 65.18C92.70 66.75 91.82 68.27 90.85 69.67C89.89 71.08 88.89 72.51 87.57 73.60C86.25 74.70 84.32 75.32 82.94 76.27C81.56 77.21 80.32 78.08 79.28 79.28C78.24 80.48 77.63 82.07 76.70 83.48C75.77 84.89 74.93 86.61 73.70 87.71C72.47 88.82 70.81 89.36 69.33 90.14C67.85 90.92 66.35 91.63 64.83 92.39C63.31 93.14 61.80 94.07 60.20 94.68C58.59 95.28 56.89 95.84 55.19 96.04C53.49 96.25 51.73 95.94 50.00 95.90C48.27 95.87 46.59 95.80 44.84 95.83C43.08 95.87 41.17 96.46 39.47 96.12C37.78 95.77 36.22 94.63 34.68 93.78C33.14 92.92 31.63 92.04 30.25 91.01C28.86 89.99 27.77 88.56 26.37 87.61C24.97 86.66 23.34 86.14 21.85 85.30C20.35 84.47 18.73 83.68 17.41 82.59C16.09 81.50 14.98 80.13 13.92 78.78C12.85 77.43 11.79 76.02 11.02 74.49C10.26 72.96 9.81 71.23 9.32 69.59C8.83 67.95 8.29 66.34 8.05 64.68C7.81 63.01 7.99 61.26 7.89 59.61C7.79 57.96 7.76 56.39 7.47 54.79C7.18 53.19 6.34 51.62 6.16 50.00C5.97 48.38 6.10 46.69 6.37 45.08C6.64 43.48 7.34 41.94 7.78 40.36C8.22 38.79 8.76 37.32 9.00 35.65C9.24 33.99 8.99 32.12 9.23 30.37C9.46 28.61 9.81 26.79 10.42 25.13C11.03 23.47 11.96 21.93 12.91 20.42C13.85 18.91 14.88 17.40 16.09 16.09C17.30 14.78 18.64 13.51 20.14 12.56C21.65 11.61 23.43 10.99 25.12 10.41C26.82 9.83 28.61 9.52 30.30 9.10C31.99 8.67 33.64 8.35 35.26 7.87C36.88 7.40 38.40 6.72 40.01 6.24C41.63 5.77 43.27 5.11 44.93 5.04C46.60 4.97 48.34 5.56 50.00 5.82C51.66 6.09 53.26 6.40 54.89 6.62C56.52 6.83 58.16 6.86 59.79 7.12C61.42 7.37 63.03 7.74 64.65 8.12C66.28 8.50 68.03 8.73 69.55 9.39C71.08 10.06 72.36 11.24 73.81 12.10C75.27 12.96 76.93 13.55 78.27 14.56C79.60 15.56 80.89 16.77 81.84 18.16C82.80 19.55 83.12 21.47 83.99 22.89C84.86 24.32 85.95 25.46 87.06 26.71C88.17 27.97 89.42 29.14 90.63 30.43C91.84 31.73 93.43 32.98 94.31 34.50C95.19 36.01 95.56 37.81 95.92 39.52C96.27 41.23 96.28 43.02 96.46 44.76C96.64 46.51 96.98 48.25 97.01 50.00Z" fill="url(#g-wax)"/><circle cx="50" cy="50" r="31.5" fill="url(#g-wax-in)" stroke="#000" stroke-opacity=".55" stroke-width="1.4"/><circle cx="50" cy="50.6" r="32.6" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width=".8"/><use href="#sym-emblem" x="31.3" y="32.4" width="38" height="37" fill="#000" fill-opacity=".7"/><use href="#sym-emblem" x="31" y="31.6" width="38" height="37" fill="url(#g-gold)"/></symbol></defs></svg>`;

function head({ title, desc, og, url }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#F3ECE1">
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="La Raza">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/logo/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/pinyon-script.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/invite/invite.css?v=7">
</head>`;
}

export function page(slug, guest, origin) {
  const [name, no, kind] = guest;
  const sphe = kind === "sd";
  const friend = kind === "f" || sphe;
  const first = kind === "f" ? name : name.replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, "").split(/\s+/)[0];
  const from = sphe ? "Sphe D" : "La Raza";
  const url = `${origin}/i/${slug}`;
  const title = friend ? `${name}, you made the list` : `${name}, you’re invited`;
  const desc = sphe
    ? "Sphe D put your name on the list · La Raza soft launch · Friday 27 November, 17:00"
    : friend
    ? "La Raza soft launch · Close friends only · Friday 27 November, 17:00"
    : "A private preview of La Raza · Friday 27 November, 17:00";
  const num = String(no).padStart(3, "0");
  const yes = wa(friend ? `It’s ${name}. Say less, I’m there on Friday 🖤` : `Hi, it’s ${name}. I’ll be there on Friday 27 November 🖤`);
  const no_ = wa(friend ? `It’s ${name}. I can’t make it on Friday 😩` : `Hi, it’s ${name}. Sadly I can’t make it on Friday 27 November.`);
  const data = JSON.stringify({ slug, name, first, kind, iso: EVENT.iso }).replace(/</g, "\\u003c");

  const opener = sphe ? `
  <section class="film" id="film" aria-label="A message from Sphe D">
    <div class="iphone"><div class="iphone__screen" id="screen">
      <iframe id="film-frame" src="/assets/film-sphe/index.html?name=${encodeURIComponent(first)}" title="A message from Sphe D" scrolling="no" tabindex="-1"></iframe>
    </div><i class="iphone__island"></i></div>
    <div class="film__btns">
      <button type="button" class="film-btn" id="sound">🔊 Tap for sound</button>
      <button type="button" class="film-btn" id="replay" hidden>↺ Watch again</button>
    </div>
    <a class="film__down" href="#invite">Your invite ↓</a>
  </section>` : friend ? `
  <section class="scene chat" id="opener" aria-label="A message from ${from}">
    <header class="chat-hdr">
      <span class="av">${sphe ? '<b class="ini">SD</b>' : '<img src="/assets/img/logo/emblem-gold.svg" alt="">'}</span>
      <span><b>${from}</b><small id="chat-st">online</small></span>
    </header>
    <div class="thread" id="thread">
      <p class="chip">Today</p>
      <p class="b in">${esc(first)}.</p>
      ${sphe ? `<p class="b in">You free Friday or you’re still “busy” 👀</p>
      <p class="b in">Something big is opening in Newcastle and I put your name on the list. Don’t embarrass me.</p>
      <p class="b in">Wear black. Not ‘black-ish’. BLACK.</p>` : `<p class="b in">You free Friday night?</p>
      <p class="b in">We’re opening our doors before anyone else.</p>
      <p class="b in">Soft launch. Close friends only. You made the list.</p>`}
      <button class="b gold-card" id="open" type="button" aria-label="Open your invite">
        <span class="gc-k">La Raza · Soft launch</span>
        <span class="gc-d">Fri 27 Nov</span>
        <span class="gc-t">Doors 17:00</span>
        <img class="gc-e" src="/assets/img/logo/emblem-mono.svg" alt="">
        <span class="gc-tap">Tap to open your invite</span>
      </button>
      <p class="typing" id="typing" aria-hidden="true"><i></i><i></i><i></i></p>
    </div>
  </section>` : `
  <section class="scene env-scene" id="opener" aria-label="Your invitation">
    <p class="kicker">La Raza · A private preview</p>
    <div class="to"><span class="for">For</span><span class="to-name fit" data-max="64">${esc(name)}</span></div>
    <div class="envelope" id="envelope">
      <div class="env-back"></div>
      <div class="letter"><img src="/assets/img/logo/emblem-gold.svg" alt=""></div>
      <svg class="pocket" viewBox="0 0 145 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0 L72.5 56 L0 100 Z" fill="#efe5d4"/><path d="M145 0 L72.5 56 L145 100 Z" fill="#efe5d4"/>
        <path d="M0 100 L72.5 50 L145 100 Z" fill="#f6eee1"/>
      </svg>
      <svg class="flap" viewBox="0 0 145 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 H145 L72.5 58 Z" fill="#ebe0cc"/><path d="M0 0 L72.5 58 L145 0" fill="none" stroke="rgba(120,90,50,.18)" stroke-width=".6"/></svg>
      <button class="seal" id="open" type="button" aria-label="Break the seal and open your invitation">
        <svg class="half l" viewBox="0 0 100 100" aria-hidden="true"><use href="#sym-seal"/></svg>
        <svg class="half r" viewBox="0 0 100 100" aria-hidden="true"><use href="#sym-seal"/></svg>
      </button>
    </div>
    <p class="hint">Tap the seal to open</p>
  </section>`;

  const card = friend ? `
    <div class="gold-big rise">
      <i class="in2"></i>
      <span class="gc-k">La Raza · Soft launch</span>
      <span class="gc-d">Fri 27 Nov</span>
      <span class="gc-t">Doors 17:00</span>
      <img class="gc-e" src="/assets/img/logo/emblem-mono.svg" alt="">
      <i class="sheen"></i>
    </div>
    <h1 class="see rise">See you Friday,<br><span class="foil fit" data-max="76">${esc(name)}</span></h1>
    <p class="sub rise">${sphe ? "Don’t be late, I’m not saving you a seat 😂 · Sphe D" : "Close friends only. You made the list."}</p>` : `
    <div class="card rise">
      <i class="in2"></i>
      <img class="c-emb" src="/assets/img/logo/emblem-gold.svg" alt="">
      <p class="c-k">A private preview for</p>
      <p class="c-name fit" data-max="54">${esc(name)}</p>
      <i class="c-rule"></i>
      <p class="c-date">Friday · 27 November · 17:00</p>
      <img class="c-word" src="/assets/img/logo/wordmark-gold.svg" alt="La Raza">
      <i class="sheen"></i>
    </div>
    <h1 class="lede rise">You’re first.</h1>
    <p class="sub rise">Before the doors open to Newcastle, they open&nbsp;for&nbsp;you.</p>`;

  return `${head({ title, desc, og: `${origin}/i/${slug}/og.png`, url })}
<body class="${friend ? "k-f" : "k-v"}${sphe ? " k-sd opened instant" : ""}">
${SPRITE}
<main>
${opener}
  <section class="invite" id="invite" aria-label="Invitation details">
${card}
    <p class="doors rise" id="doors">Doors open on Friday</p>
    <p class="details rise">Friday 27 November · 17:00<br>Formal · All black<br>${friend ? "Close friends only" : "By invitation only"} · Newcastle</p>

    <div class="rsvp rise">
      <a class="btn gold" href="${esc(yes)}" target="_blank" rel="noopener">${friend ? "Say less. I’m there" : "I’ll be there"}</a>
      <a class="btn line" href="${esc(no_)}" target="_blank" rel="noopener">${friend ? "Can’t make it" : "Sadly, I can’t make it"}</a>
      <p class="by">Kindly reply by ${EVENT.rsvpBy} · <span class="nw">${EVENT.phone}</span></p>
      <a class="cal" id="cal" href="/assets/invite/la-raza-soft-launch.ics">Add to calendar</a>
    </div>

    <footer class="foot">
      <img src="/assets/img/logo/wordmark-gold.svg" alt="La Raza">
      <p>Show this at the door · Guest ${num}</p>
      <button type="button" class="again" id="again">${friend ? "Replay the message" : "Open the envelope again"}</button>
    </footer>
  </section>
</main>
<script>window.LR=${data}</script>
<script src="/assets/invite/invite.js?v=7" defer></script>
</body>
</html>`;
}

export function notFound(origin) {
  return `${head({ title: "La Raza · Invitation", desc: "A private preview of La Raza, Newcastle.", og: `${origin}/i/x/og.png`, url: origin })}
<body class="k-v nf">
<main>
  <section class="scene env-scene">
    <img src="/assets/img/logo/emblem-gold.svg" alt="" style="width:64px">
    <p class="kicker">La Raza · A private preview</p>
    <h1 class="lede">This invitation link isn’t quite right.</h1>
    <p class="sub">Please check the link you were sent, or message us on ${EVENT.phone}.</p>
  </section>
</main>
</body>
</html>`;
}
