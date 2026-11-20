/* ==========================================================================
   LA RAZA — The Swarm (intro)

   1. Birth     The drawn emblem pulses and releases a swarm of tiny gold
                butterflies (the emblem split into two flapping wings).
   2. Flight    Each one flies its own curved 3D path, banking and swirling,
                leaving a trail of gold dust.
   3. Formation They land in the shape of the La Raza butterfly.
   4. Shimmer   A wave of light runs out from the centre: each butterfly
                lifts, flutters and throws off a spark of gold.
   5. Take-off  The big butterfly flaps twice and flies at you,
                handing over to the page.

   Plays on every load; tap anywhere to skip; tap the logo to replay.
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

  if (!swarm || reduced || !Element.prototype.animate) {
    if (swarm) swarm.hidden = true;
    ready();
    return;
  }

  // Butterfly formation, sampled from the emblem artwork (x, y in -1..1).
  const BUTTERFLY = [[-.725,-.769],[-.55,-.769],[-.375,-.769],[.5,-.769],[.675,-.769],[-.8,-.59],[-.625,-.59],[-.45,-.59],[-.275,-.59],[.25,-.59],[.425,-.59],[.6,-.59],[.775,-.59],[-.55,-.41],[-.2,-.41],[-.025,-.41],[.15,-.41],[.5,-.41],[.675,-.41],[-.8,-.231],[-.625,-.231],[-.45,-.231],[-.275,-.231],[.25,-.231],[.425,-.231],[.6,-.231],[.775,-.231],[-.9,-.051],[-.725,-.051],[-.55,-.051],[-.375,-.051],[-.025,-.051],[.325,-.051],[.5,-.051],[.675,-.051],[.85,-.051],[-.45,.128],[-.1,.128],[.425,.128],[-.2,.308],[.15,.308],[-.275,.487],[.25,.487],[-.375,.667],[-.2,.667],[.15,.667],[.325,.667],[-.275,.846],[.25,.846]];

  const PERSPECTIVE = 900;

  /* ---------- math ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const v = clamp((x - a) / (b - a)); return v * v * (3 - 2 * v); };
  const easeOut = (p) => 1 - Math.pow(1 - p, 2.4);
  const easeInOut = (p) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOutBack = (p) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const lerpAngle = (a, b, w) => a + ((((b - a) % 360) + 540) % 360 - 180) * w;
  const bez = (a, b, c, d, u) => { const m = 1 - u; return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d; };
  const bezD = (a, b, c, d, u) => { const m = 1 - u; return 3 * m * m * (b - a) + 6 * m * u * (c - b) + 3 * u * u * (d - c); };
  const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };

  let running = false;

  const replay = document.getElementById('logo-replay');
  if (replay) replay.addEventListener('click', () => { if (!running) play(true); });

  play(false);

  /* ======================================================================== */
  function play(isReplay) {
    running = true;
    swarm.hidden = false;
    swarm.classList.remove('is-done', 'is-leaving');
    swarm.classList.toggle('is-replay', !!isReplay); // page is already showing: cover it more
    swarm.innerHTML = '';

    // Layers, back to front
    const canvas = el('canvas', 'swarm__dust', swarm);
    const glow = el('div', 'swarm__glow', swarm);
    const stage = el('div', 'swarm__stage', swarm);
    const wingL = el('div', 'swarm__wing swarm__wing--l', stage);
    const wingR = el('div', 'swarm__wing swarm__wing--r', stage);
    const skip = el('button', 'swarm__skip', swarm);
    skip.type = 'button';
    skip.textContent = 'Skip';

    // Size the formation to the screen: as wide as a phone allows, but never taller than ~58% of it
    const vw = innerWidth, vh = innerHeight;
    const portrait = vh > vw;
    const ratio = 1206 / 1170;
    const size = Math.round(Math.min(vw * (portrait ? .94 : .8), 600, vh * (portrait ? .58 : .7) * ratio));
    stage.style.width = size + 'px';
    const rect = stage.getBoundingClientRect();
    // Depth scales with the formation, so a phone gets the same 3D feel as a desktop, not an exaggerated one
    const ZK = clamp(size / 600, .45, 1);
    const half = { x: rect.width / 2, y: rect.height / 2 };
    const tileW = Math.round(rect.width * 0.09);
    stage.style.setProperty('--tile', tileW + 'px');
    const R = Math.max(innerWidth, innerHeight);
    const center = { x: innerWidth / 2, y: innerHeight / 2 };

    // Where the swarm is born: the logo emblem on the page
    const emblem = document.querySelector('.logo__emblem');
    const eb = emblem ? emblem.getBoundingClientRect() : null;
    const origin = eb
      ? { x: eb.left + eb.width / 2 - (rect.left + half.x), y: eb.top + eb.height / 2 - (rect.top + half.y) }
      : { x: 0, y: -half.y * 1.4 };

    // Dust canvas
    const dpr = finePointer ? Math.min(devicePixelRatio || 1, 1.5) : 1;
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    const ctx = canvas.getContext('2d');

    /* ---------- timeline (ms from start) ---------- */
    const S = isReplay ? 250 : 950;      // release, just as the emblem finishes drawing
    const SPREAD = 520;
    const REVEAL = S + 2300;             // shimmer wave starts once they've landed
    const FLAP = REVEAL + 1150;
    const TAKEOFF = FLAP + 850;
    const TAKEOFF_DUR = 900;
    const END = TAKEOFF + TAKEOFF_DUR;

    /* ---------- build the swarm ---------- */
    const swirl = Math.random() < .5 ? 1 : -1;
    const tiles = BUTTERFLY.map(([bx, by]) => {
      const t = el('div', 'bf', bx < 0 ? wingL : wingR);
      const wl = el('div', 'bf__wing bf__wing--l', t);
      const wr = el('div', 'bf__wing bf__wing--r', t);

      const T = { x: bx * half.x, y: by * half.y };
      const p0 = { x: origin.x + rnd(-8, 8), y: origin.y + rnd(-8, 8), z: 0 };
      const a = rnd(-.15, 1.15) * Math.PI;           // mostly outward and down from the logo
      const d = rnd(.32, .7) * R;
      const p1 = { x: p0.x + Math.cos(a) * d, y: p0.y + Math.sin(a) * d * .8, z: rnd(-750, 380) * ZK };
      let v = { x: T.x, y: T.y };
      if (Math.hypot(v.x, v.y) < 50) v = { x: rnd(-90, 90), y: rnd(-90, 90) };
      const th = swirl * rnd(.8, 1.6);                 // everyone circles the same way: a vortex
      const k = rnd(1.3, 1.8);
      const p2 = { x: (v.x * Math.cos(th) - v.y * Math.sin(th)) * k, y: (v.x * Math.sin(th) + v.y * Math.cos(th)) * k, z: rnd(-380, 240) * ZK };
      const len = Math.hypot(T.x, T.y) || 1;

      return {
        el: t, wl, wr, T, p0, p1, p2,
        dir: { x: T.x / len, y: T.y / len, z: rnd(.3, 1) },
        start: S + rnd(0, SPREAD),
        dur: rnd(1700, 2100),
        omega: Math.PI * 2 * rnd(4.6, 6.4) / 1000,
        phase: rnd(0, Math.PI * 2),
        bank: rnd(-30, 30),
        rEnd: rnd(-7, 7),
        shineAt: REVEAL + Math.hypot(bx, by) / 1.2 * 420 + rnd(0, 60),
        sparked: false,
        wing: -1, op: -1,
        pos: { x: p0.x, y: p0.y, z: 0 }, p: 0,
      };
    });

    /* ---------- tilt: mouse on desktop, a slow sway on phones ---------- */
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      tilt.tx = (e.clientY / innerHeight - .5) * -16;
      tilt.ty = (e.clientX / innerWidth - .5) * 22;
    };
    if (finePointer) addEventListener('pointermove', onMove, { passive: true });

    /* ---------- one-shot events ---------- */
    const fired = new Set();
    const at = (t, key, fn) => { if (t >= 0 && !fired.has(key)) { fired.add(key); fn(); } };
    function pulseEmblem() {
      if (!emblem) return;
      emblem.animate([
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.16)', filter: 'brightness(1.6)', offset: .35 },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }

    function flapBig(times, amp, duration) {
      const frames = (sign) => {
        const f = [{ transform: 'rotateY(0deg)' }];
        for (let n = 0; n < times; n++) {
          f.push({ transform: `rotateY(${sign * amp}deg)`, offset: (n * 2 + 1) / (times * 2) });
          f.push({ transform: 'rotateY(0deg)', offset: (n * 2 + 2) / (times * 2) });
        }
        return f;
      };
      wingL.animate(frames(1), { duration, easing: 'ease-in-out' });
      wingR.animate(frames(-1), { duration, easing: 'ease-in-out' });
    }

    /* ---------- frame loop ---------- */
    const t0 = performance.now();
    let raf = 0;
    let dustOn = true;
    const sparks = [];

    function frame(now) {
      const t = now - t0;

      at(t - (S - 60), 'pulse', pulseEmblem);
      at(t - REVEAL, 'glow', () => glow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' }));
      at(t - FLAP, 'flap', () => flapBig(2, 52, 850));
      at(t - TAKEOFF, 'takeoff', () => {
        flapBig(1, 70, 520);
        swarm.classList.add('is-leaving');
        glow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
      });
      at(t - (TAKEOFF + 250), 'ready', ready);
      if (t >= END) { finish(); return; }

      // Stage: tilt, sway and the final rush toward the camera
      if (!finePointer && t > REVEAL) {
        tilt.tx = Math.cos(t / 1300) * 2;
        tilt.ty = Math.sin(t / 1100) * 4;
      }
      tilt.x += (tilt.tx - tilt.x) * .08;
      tilt.y += (tilt.ty - tilt.y) * .08;
      const ko = clamp((t - TAKEOFF) / TAKEOFF_DUR);
      const ke = easeInOut(ko);
      stage.style.transform = `translate3d(0, ${-110 * ZK * ke}px, ${780 * ZK * ke}px) rotateX(${tilt.x + 18 * ke}deg) rotateY(${tilt.y}deg)`;

      // Butterflies
      let flying = 0;
      for (const b of tiles) {
        if (t < b.start) continue;
        const p = clamp((t - b.start) / b.dur);
        b.p = p;
        if (p < 1) flying++;
        const u = easeOut(p);
        let x = bez(b.p0.x, b.p1.x, b.p2.x, b.T.x, u);
        let y = bez(b.p0.y, b.p1.y, b.p2.y, b.T.y, u);
        let z = bez(0, b.p1.z, b.p2.z, 0, u);
        const dx = bezD(b.p0.x, b.p1.x, b.p2.x, b.T.x, u);
        const dy = bezD(b.p0.y, b.p1.y, b.p2.y, b.T.y, u);
        const heading = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        const rz = lerpAngle(heading, b.rEnd, smooth(.7, 1, p));
        const rx = b.bank * Math.sin(p * Math.PI);
        const sc = p < .15 ? .18 + .82 * (p / .15) : 1;

        // Shimmer: the wave lifts each one toward you with a little pop and a flutter
        let sc2 = 1, shine = 0;
        if (t >= b.shineAt) {
          const fp = clamp((t - b.shineAt) / 620);
          shine = Math.sin(fp * Math.PI);
          z += shine * 90 * ZK;
          sc2 = 1 + shine * .28;
          if (!b.sparked) { b.sparked = true; sparks.push({ b, t }); }
        }

        // Take-off: scatter outward and past the viewer
        let op = 1;
        if (ko > 0) {
          const kk = ko * ko;
          x += b.dir.x * 560 * ZK * kk;
          y += b.dir.y * 560 * ZK * kk;
          z += b.dir.z * 650 * ZK * kk;
          op = 1 - smooth(.35, 1, ko);
        }

        b.pos.x = x; b.pos.y = y; b.pos.z = z;
        b.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateZ(${rz.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg) scale(${(sc * sc2).toFixed(3)})`;
        if (op !== b.op) { b.el.style.opacity = op; b.op = op; }

        // Wingbeat, calming as it lands
        const amp = Math.max(70 * (1 - smooth(.68, .96, p)), 75 * shine);
        const wing = amp > .2 ? amp * (.5 + .5 * Math.sin(b.omega * t + b.phase)) : 0;
        if (wing !== b.wing) {
          b.wl.style.transform = `rotateY(${wing.toFixed(1)}deg)`;
          b.wr.style.transform = `rotateY(${(-wing).toFixed(1)}deg)`;
          b.wing = wing;
        }
      }

      // Gold dust trails
      if (dustOn) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,.13)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'lighter';
        for (const b of tiles) {
          if (t < b.start || b.p >= 1) continue;
          const f = PERSPECTIVE / (PERSPECTIVE - Math.min(b.pos.z, PERSPECTIVE - 50));
          const sx = (center.x + b.pos.x * f) * dpr;
          const sy = (center.y + b.pos.y * f) * dpr;
          ctx.fillStyle = `rgba(234,195,134,${(.65 * (1 - b.p)).toFixed(3)})`;
          for (let n = 0; n < (finePointer ? 2 : 1); n++) {
            ctx.beginPath();
            ctx.arc(sx + rnd(-4, 4) * dpr, sy + rnd(-4, 4) * dpr, rnd(.6, 1.8) * dpr * f, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Sparks thrown off by the shimmer wave
        for (let n = sparks.length - 1; n >= 0; n--) {
          const sp = sparks[n];
          const age = (t - sp.t) / 700;
          if (age >= 1) { sparks.splice(n, 1); continue; }
          const f = PERSPECTIVE / (PERSPECTIVE - Math.min(sp.b.pos.z, PERSPECTIVE - 50));
          const sx = (center.x + sp.b.pos.x * f) * dpr;
          const sy = (center.y + sp.b.pos.y * f) * dpr;
          const rad = (6 + age * 26) * ZK * dpr;
          ctx.fillStyle = `rgba(234,195,134,${(.75 * (1 - age)).toFixed(3)})`;
          for (let m = 0; m < (finePointer ? 3 : 2); m++) {
            const ang = rnd(0, Math.PI * 2);
            ctx.beginPath();
            ctx.arc(sx + Math.cos(ang) * rad, sy + Math.sin(ang) * rad, rnd(.6, 1.6) * dpr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (!flying && !sparks.length && t > REVEAL + 1600) { dustOn = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
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
      removeEventListener('pointermove', onMove);
      removeEventListener('keydown', onKey);
      removeEventListener('resize', onResize);
      swarm.removeEventListener('click', finish);
      swarm.classList.add('is-done');
      ready();
      setTimeout(() => {
        swarm.hidden = true;
        swarm.innerHTML = '';
        swarm.classList.remove('is-done', 'is-leaving', 'is-replay');
        running = false;
      }, 650);
    }
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); };
    addEventListener('keydown', onKey);
    const onResize = () => { if (Math.abs(innerWidth - vw) > 40 || Math.abs(innerHeight - vh) > 160) finish(); };
    addEventListener('resize', onResize);
    swarm.addEventListener('click', finish);
  }
})();
