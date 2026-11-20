/* ==========================================================================
   LA RAZA — The Swarm (intro)

   1. Birth     The drawn emblem pulses and releases a swarm of tiny gold
                butterflies (the emblem split into two flapping wings).
   2. Flight    Each one flies its own curved 3D path, banking and swirling,
                leaving a trail of gold dust.
   3. Formation They land in the shape of the La Raza butterfly.
   4. Reveal    A wave from the centre flips every tile to show a photo.
   5. Pop-out   Two photos lift out as large 3D cards while the captions play.
   6. Take-off  Cards return, the big butterfly flaps twice and flies at you,
                handing over to the page.

   Plays once per visit; tap anywhere to skip; tap the logo to replay.
   Photos, cards and captions come from data-* attributes on #swarm.
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

  const list = (s) => (s || '').split(',').map((v) => v.trim()).filter(Boolean);
  const PHOTOS = list(swarm.dataset.photos);
  const CARDS = list(swarm.dataset.cards);
  const CAPTIONS = (swarm.dataset.captions || '').split('|').map((v) => v.trim()).filter(Boolean);
  const PERSPECTIVE = 900;

  // Warm the cache so tiles and cards are ready by the time they flip.
  [...PHOTOS, ...CARDS].forEach((src) => { const i = new Image(); i.src = src; });

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
  let seen = false;
  try { seen = sessionStorage.getItem('lr-swarm') === '1'; } catch (_) {}

  const replay = document.getElementById('logo-replay');
  if (replay) replay.addEventListener('click', () => { if (!running) play(true); });

  if (seen) { swarm.hidden = true; ready(); } else { play(false); }

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
    const veil = el('div', 'swarm__veil', swarm);
    const caption = el('p', 'swarm__caption', swarm);
    const skip = el('button', 'swarm__skip', swarm);
    skip.type = 'button';
    skip.textContent = 'Skip';

    const rect = stage.getBoundingClientRect();
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
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    const ctx = canvas.getContext('2d');

    /* ---------- timeline (ms from start) ---------- */
    const S = isReplay ? 250 : 950;      // release, just as the emblem finishes drawing
    const SPREAD = 520;
    const REVEAL = S + 2350;             // flip wave starts
    const POP = REVEAL + 850;            // cards lift out
    const CAP2 = POP + 1350;
    const RETURN = POP + 2550;
    const FLAP = RETURN + 450;
    const TAKEOFF = FLAP + 850;
    const TAKEOFF_DUR = 900;
    const END = TAKEOFF + TAKEOFF_DUR;

    /* ---------- build the swarm ---------- */
    const swirl = Math.random() < .5 ? 1 : -1;
    const tiles = BUTTERFLY.map(([bx, by], i) => {
      const photo = PHOTOS.length ? i % PHOTOS.length : 0;
      const t = el('div', 'bf', bx < 0 ? wingL : wingR);
      // Absolute URL: a url() inside a custom property resolves against the stylesheet otherwise
      t.style.setProperty('--img', PHOTOS.length ? `url("${new URL(PHOTOS[photo], document.baseURI).href}")` : 'none');
      const wl = el('div', 'bf__wing bf__wing--l', t);
      const wr = el('div', 'bf__wing bf__wing--r', t);
      [wl, wr].forEach((w) => { el('i', 'bf__front', w); el('i', 'bf__back', w); });

      const T = { x: bx * half.x, y: by * half.y };
      const p0 = { x: origin.x + rnd(-8, 8), y: origin.y + rnd(-8, 8), z: 0 };
      const a = rnd(-.15, 1.15) * Math.PI;           // mostly outward and down from the logo
      const d = rnd(.32, .7) * R;
      const p1 = { x: p0.x + Math.cos(a) * d, y: p0.y + Math.sin(a) * d * .8, z: rnd(-750, 380) };
      let v = { x: T.x, y: T.y };
      if (Math.hypot(v.x, v.y) < 50) v = { x: rnd(-90, 90), y: rnd(-90, 90) };
      const th = swirl * rnd(.8, 1.6);                 // everyone circles the same way: a vortex
      const k = rnd(1.3, 1.8);
      const p2 = { x: (v.x * Math.cos(th) - v.y * Math.sin(th)) * k, y: (v.x * Math.sin(th) + v.y * Math.cos(th)) * k, z: rnd(-380, 240) };
      const len = Math.hypot(T.x, T.y) || 1;

      return {
        el: t, wl, wr, photo, T, p0, p1, p2,
        dir: { x: T.x / len, y: T.y / len, z: rnd(.3, 1) },
        start: S + rnd(0, SPREAD),
        dur: rnd(1700, 2100),
        omega: Math.PI * 2 * rnd(4.6, 6.4) / 1000,
        phase: rnd(0, Math.PI * 2),
        bank: rnd(-30, 30),
        rEnd: rnd(-7, 7),
        flipAt: REVEAL + Math.hypot(bx, by) / 1.2 * 320 + rnd(0, 60),
        wing: -1, op: -1, popped: false,
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
    let cards = [];

    const say = (text) => {
      caption.classList.remove('is-on');
      setTimeout(() => { caption.textContent = text; caption.classList.add('is-on'); }, caption.textContent ? 360 : 0);
    };

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

    function popCards() {
      if (!CARDS.length) return;
      const small = innerWidth < 600;
      const W = Math.round(small ? innerWidth * .43 : Math.min(280, innerWidth * .22));
      const H = Math.round(W * 1.25);
      const cy = innerHeight * (small ? .44 : .46);
      const spots = [
        { x: center.x - W * (small ? .52 : .6), y: cy - H * .03, rz: -6, ry: 14 },
        { x: center.x + W * (small ? .52 : .6), y: cy + H * .05, rz: 5, ry: -14 },
      ];
      const halfPhotos = Math.max(1, Math.ceil(PHOTOS.length / 2));
      cards = CARDS.slice(0, 2).map((src, k) => {
        // Lift the card out of a tile near the middle of each wing, showing the same shoot
        const want = { x: (k ? .5 : -.5) * half.x, y: -.42 * half.y };
        const pool = tiles.filter((t) => !t.popped && (k ? t.photo >= halfPhotos : t.photo < halfPhotos) && (k ? t.T.x > 0 : t.T.x < 0));
        const tile = (pool.length ? pool : tiles).reduce((best, t) =>
          Math.hypot(t.T.x - want.x, t.T.y - want.y) < Math.hypot(best.T.x - want.x, best.T.y - want.y) ? t : best);
        const r = tile.el.getBoundingClientRect();
        tile.popped = true;

        const c = el('div', 'swarm__card', swarm);
        c.style.width = W + 'px';
        c.style.height = H + 'px';
        const img = el('img', '', c);
        img.src = src; img.alt = '';
        const s = spots[k];
        const from = `translate3d(${r.left + r.width / 2 - W / 2}px, ${r.top + r.height / 2 - H / 2}px, 0) rotateZ(${tile.rEnd}deg) rotateY(0deg) scale(${r.width / W})`;
        const mid = `translate3d(${(r.left + s.x) / 2 - W / 2}px, ${(r.top + s.y) / 2 - H / 2 - 30}px, 220px) rotateZ(${s.rz * 2}deg) rotateY(${s.ry * -2.4}deg) scale(.75)`;
        const to = `translate3d(${s.x - W / 2}px, ${s.y - H / 2}px, 40px) rotateZ(${s.rz}deg) rotateY(${s.ry}deg) scale(1)`;
        const frames = [{ transform: from }, { transform: mid, offset: .45 }, { transform: to }];
        c.animate(frames, { duration: 950, delay: k * 200, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'both' });
        setTimeout(() => c.classList.add('is-shine'), 950 + k * 200);
        // A gentle float while it is held
        setTimeout(() => {
          c.animate([{ transform: to }, { transform: to.replace('40px)', '70px)') + ` rotateZ(${-s.rz * .3}deg)` }],
            { duration: 1400, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', fill: 'both' });
        }, 1150 + k * 200);
        return { c, tile, frames };
      });
      veil.animate([{ opacity: 0 }, { opacity: .62 }], { duration: 600, fill: 'forwards' });
    }

    function returnCards() {
      cards.forEach(({ c, tile, frames }, k) => {
        c.getAnimations().forEach((a) => a.cancel());
        const back = c.animate([...frames].reverse(), { duration: 700, delay: k * 120, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'both' });
        back.onfinish = () => { tile.popped = false; c.remove(); };
      });
      veil.animate([{ opacity: .62 }, { opacity: 0 }], { duration: 600, delay: 250, fill: 'forwards' });
    }

    /* ---------- frame loop ---------- */
    const t0 = performance.now();
    let raf = 0;
    let dustOn = true;

    function frame(now) {
      const t = now - t0;

      at(t - (S - 60), 'pulse', pulseEmblem);
      at(t - REVEAL, 'glow', () => glow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' }));
      at(t - POP, 'pop', () => { popCards(); say(CAPTIONS[0] || ''); });
      at(t - CAP2, 'cap2', () => { if (CAPTIONS[1]) say(CAPTIONS[1]); });
      at(t - RETURN, 'return', () => { returnCards(); caption.classList.remove('is-on'); });
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
        tilt.tx = Math.cos(t / 1100) * 4;
        tilt.ty = Math.sin(t / 900) * 9;
      }
      tilt.x += (tilt.tx - tilt.x) * .08;
      tilt.y += (tilt.ty - tilt.y) * .08;
      const ko = clamp((t - TAKEOFF) / TAKEOFF_DUR);
      const ke = easeInOut(ko);
      stage.style.transform = `translate3d(0, ${-110 * ke}px, ${780 * ke}px) rotateX(${tilt.x + 18 * ke}deg) rotateY(${tilt.y}deg)`;

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

        // Flip from gold butterfly to photo
        let ry = 180;
        if (t >= b.flipAt) {
          const fp = clamp((t - b.flipAt) / 520);
          ry = 180 - 180 * easeOutBack(fp);
          z += Math.sin(fp * Math.PI) * 70;
        }

        // Take-off: scatter outward and past the viewer
        let op = 1;
        if (ko > 0) {
          const kk = ko * ko;
          x += b.dir.x * 560 * kk;
          y += b.dir.y * 560 * kk;
          z += b.dir.z * 650 * kk;
          op = 1 - smooth(.35, 1, ko);
        }
        if (b.popped) op = 0;

        b.pos.x = x; b.pos.y = y; b.pos.z = z;
        b.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateZ(${rz.toFixed(1)}deg) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        if (op !== b.op) { b.el.style.opacity = op; b.op = op; }

        // Wingbeat, calming as it lands
        const amp = 70 * (1 - smooth(.68, .96, p));
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
          for (let n = 0; n < 2; n++) {
            ctx.beginPath();
            ctx.arc(sx + rnd(-4, 4) * dpr, sy + rnd(-4, 4) * dpr, rnd(.6, 1.8) * dpr * f, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (!flying && t > REVEAL + 1400) { dustOn = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
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
      swarm.removeEventListener('click', finish);
      swarm.classList.add('is-done');
      ready();
      try { sessionStorage.setItem('lr-swarm', '1'); } catch (_) {}
      setTimeout(() => {
        swarm.hidden = true;
        swarm.innerHTML = '';
        swarm.classList.remove('is-done', 'is-leaving', 'is-replay');
        running = false;
      }, 650);
    }
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish(); };
    addEventListener('keydown', onKey);
    swarm.addEventListener('click', finish);
  }
})();
