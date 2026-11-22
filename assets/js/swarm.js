/* ==========================================================================
   LA RAZA — The Swarm (intro)

   A quick one: the emblem draws itself, pulses, and releases a flock of small
   gold butterflies. They swoop across the screen together and fly off the top,
   and the page rises in behind them. About 3 seconds from load.

   Plays on every load (not when the link points to a section, e.g. #hiring);
   tap anywhere to skip; tap the logo to replay.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const swarm = document.getElementById('swarm');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  let readyFired = false;
  const ready = () => {
    if (readyFired) return;
    readyFired = true;
    root.classList.add('is-ready');
    document.dispatchEvent(new Event('lr:ready'));
  };

  // A link straight to a section (like #hiring) skips the intro
  let deepLink = false;
  try { deepLink = location.hash.length > 1 && !!document.querySelector(location.hash); } catch (e) { /* not a selector */ }

  if (!swarm || reduced || !Element.prototype.animate) {
    if (swarm) swarm.hidden = true;
    ready();
    return;
  }

  const PERSPECTIVE = 900;
  const COUNT = finePointer ? 38 : 28;

  /* ---------- math ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const v = clamp((x - a) / (b - a)); return v * v * (3 - 2 * v); };
  const bez = (a, b, c, d, u) => { const m = 1 - u; return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d; };
  const bezD = (a, b, c, d, u) => { const m = 1 - u; return 3 * m * m * (b - a) + 6 * m * u * (c - b) + 3 * u * u * (d - c); };
  const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };

  let running = false;

  // The background film waits while the flock flies, so the phone has one thing to draw.
  const video = document.getElementById('bg');
  const holdVideo = () => { if (video) video.pause(); };
  const resumeVideo = () => {
    if (video && video.paused && !video.dataset.offscreen) { const p = video.play(); if (p) p.catch(() => {}); }
  };

  // Draw the emblem to a bitmap once, so it is never re-rendered as vector art mid-flight.
  const emblemImg = new Image();
  emblemImg.src = new URL('assets/img/logo/emblem-gold.svg', document.baseURI).href;
  const emblemReady = (emblemImg.decode ? emblemImg.decode() : Promise.resolve()).catch(() => {});
  let bakedUrl = '';
  function bakeEmblem(tileW) {
    return new Promise((resolve) => {
      try {
        const k = Math.min(devicePixelRatio || 1, 2) * 1.6; // headroom for flying close to the camera
        const w = Math.round(tileW * k), h = Math.round(tileW * 1.25 * k);
        const eh = Math.round(w * 1170 / 1206);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(emblemImg, 0, Math.round((h - eh) / 2), w, eh);
        c.toBlob((blob) => {
          if (!blob) return resolve('');
          if (bakedUrl) URL.revokeObjectURL(bakedUrl);
          bakedUrl = URL.createObjectURL(blob); // short blob: URL; a data: URL would be re-parsed on every style update
          resolve(`url("${bakedUrl}")`);
        }, 'image/png');
      } catch (e) { resolve(''); }
    });
  }

  const replay = document.getElementById('logo-replay');
  if (replay) replay.addEventListener('click', () => { if (!running) play(true); });

  if (deepLink) {
    swarm.hidden = true;
    ready();
  } else {
    holdVideo();
    emblemReady.then(() => play(false));
  }

  /* ======================================================================== */
  function play(isReplay) {
    running = true;
    swarm.hidden = false;
    swarm.classList.remove('is-done', 'is-leaving');
    swarm.classList.toggle('is-replay', !!isReplay);
    swarm.innerHTML = '';
    holdVideo();

    const canvas = el('canvas', 'swarm__dust', swarm);
    const stage = el('div', 'swarm__stage', swarm);

    const vw = innerWidth, vh = innerHeight;
    const W2 = vw / 2, H2 = vh / 2;
    const tileW = Math.round(Math.min(vw, 640) * (vw < 600 ? .1 : .075));
    stage.style.setProperty('--tile', tileW + 'px');
    if (emblemImg.complete && emblemImg.naturalWidth) {
      bakeEmblem(tileW).then((u) => { if (u) { stage.style.setProperty('--bf', u); stage.classList.add('has-bf'); } });
    }
    const ZK = clamp(Math.min(vw, vh) / 700, .5, 1); // depth scales with the screen

    // Born at the logo emblem
    const emblem = document.querySelector('.logo__emblem');
    const eb = emblem ? emblem.getBoundingClientRect() : null;
    const O = eb && eb.bottom > 0 && eb.top < vh
      ? { x: eb.left + eb.width / 2 - W2, y: eb.top + eb.height / 2 - H2 }
      : { x: 0, y: -H2 * .55 };

    // The flock's shared path: swoop out and down, swing across, lift off the top
    const dir = Math.random() < .5 ? 1 : -1;
    const P = [
      O,
      { x: dir * W2 * 1.05, y: O.y + H2 * .9 },
      { x: -dir * W2 * 1.1, y: H2 * .85 },
      { x: dir * W2 * .3, y: -H2 * 1.45 },
    ];
    const spreadMax = Math.min(W2, H2) * .42;

    const dpr = finePointer ? Math.min(devicePixelRatio || 1, 1.5) : 1;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    const ctx = canvas.getContext('2d');

    /* ---------- timeline (ms) ---------- */
    const S = isReplay ? 200 : 950;   // release, just as the emblem finishes drawing
    const STAGGER = 380;
    const DUR = 1900;
    const READY = S + 750;            // the page rises while the flock is still in the air
    const END = S + STAGGER + DUR + 80;

    /* ---------- the flock ---------- */
    const birds = Array.from({ length: COUNT }, () => {
      const t = el('div', 'bf', stage);
      const wl = el('div', 'bf__wing bf__wing--l', t);
      const wr = el('div', 'bf__wing bf__wing--r', t);
      const r = Math.sqrt(Math.random()) * spreadMax;
      const a = rnd(0, Math.PI * 2);
      return {
        el: t, wl, wr,
        start: S + rnd(0, STAGGER),
        dur: DUR * rnd(.88, 1.06),
        ox: Math.cos(a) * r, oy: Math.sin(a) * r * .8,
        twist: rnd(-1.6, 1.6),             // each one circles its place in the flock a little
        z: rnd(-160, 340) * ZK,
        size: rnd(.7, 1.15),
        omega: Math.PI * 2 * rnd(5, 7) / 1000,
        phase: rnd(0, Math.PI * 2),
        bank: rnd(-28, 28),
        pos: { x: O.x, y: O.y, z: 0 }, p: 0,
        tf: '', wing: -1, op: -1,
      };
    });

    function pulseEmblem() {
      if (!emblem) return;
      emblem.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.16)', offset: .35 },
        { transform: 'scale(1)' },
      ], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }

    const fired = new Set();
    const at = (t, key, fn) => { if (t >= 0 && !fired.has(key)) { fired.add(key); fn(); } };

    /* ---------- frame loop ---------- */
    const t0 = performance.now();
    let raf = 0;

    function frame(now) {
      const t = now - t0;
      at(t - (S - 60), 'pulse', pulseEmblem);
      at(t - READY, 'ready', () => { swarm.classList.add('is-leaving'); ready(); });
      if (t >= END) { finish(); return; }

      for (const b of birds) {
        if (t < b.start) continue;
        const p = clamp((t - b.start) / b.dur);
        b.p = p;
        const u = p * p * (3 - 2 * p) * .45 + p * .55; // eases in and out a touch
        const spread = smooth(0, .35, u);
        const ang = b.twist * u * Math.PI;
        const ox = (b.ox * Math.cos(ang) - b.oy * Math.sin(ang)) * spread;
        const oy = (b.ox * Math.sin(ang) + b.oy * Math.cos(ang)) * spread;
        const x = bez(P[0].x, P[1].x, P[2].x, P[3].x, u) + ox;
        const y = bez(P[0].y, P[1].y, P[2].y, P[3].y, u) + oy;
        const z = b.z * Math.sin(Math.PI * Math.min(1, u * 1.2));
        const dx = bezD(P[0].x, P[1].x, P[2].x, P[3].x, u);
        const dy = bezD(P[0].y, P[1].y, P[2].y, P[3].y, u);
        const rz = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        const rx = b.bank * Math.sin(p * Math.PI);
        const sc = b.size * (p < .12 ? .2 + .8 * (p / .12) : 1);
        b.pos.x = x; b.pos.y = y; b.pos.z = z;

        const tf = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateZ(${rz.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        if (tf !== b.tf) { b.el.style.transform = tf; b.tf = tf; }
        const op = p >= 1 ? 0 : Math.round((1 - smooth(.82, 1, p)) * 50) / 50;
        if (op !== b.op) { b.el.style.opacity = op; b.op = op; }

        const wing = p >= 1 ? 0 : Math.round(66 * (.5 + .5 * Math.sin(b.omega * t + b.phase)) * 2) / 2;
        if (wing !== b.wing) {
          b.wl.style.transform = `rotateY(${wing}deg)`;
          b.wr.style.transform = `rotateY(${-wing}deg)`;
          b.wing = wing;
        }
      }

      // Gold dust trail
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,.14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      for (const b of birds) {
        if (t < b.start || b.p >= .9) continue;
        const f = PERSPECTIVE / (PERSPECTIVE - Math.min(b.pos.z, PERSPECTIVE - 50));
        const sx = (W2 + b.pos.x * f) * dpr;
        const sy = (H2 + b.pos.y * f) * dpr;
        ctx.fillStyle = `rgba(234,195,134,${(.6 * (1 - b.p)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx + rnd(-4, 4) * dpr, sy + rnd(-4, 4) * dpr, rnd(.6, 1.7) * dpr * f, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    /* ---------- skip / finish ---------- */
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      swarm.removeEventListener('click', finish);
      swarm.classList.add('is-done');
      ready();
      resumeVideo();
      setTimeout(() => {
        swarm.hidden = true;
        swarm.innerHTML = '';
        swarm.classList.remove('is-done', 'is-leaving', 'is-replay');
        running = false;
      }, 650);
    }
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); };
    const onResize = () => { if (Math.abs(innerWidth - vw) > 40 || Math.abs(innerHeight - vh) > 160) finish(); };
    addEventListener('keydown', onKey);
    addEventListener('resize', onResize);
    swarm.addEventListener('click', finish);
  }
})();
