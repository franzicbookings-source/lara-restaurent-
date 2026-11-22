/* ==========================================================================
   LA RAZA — We're hiring: an invitation

   "Oh, and one more thing… We're hiring." A cream envelope sealed with black
   wax and the gold emblem. Tap the seal (or just wait a moment): the wax
   cracks in two, the flap swings open on its gold lining, a few gold
   butterflies slip out and the card rises from the envelope:
   "La Raza requests the pleasure of your company & your CV."

   Every movement is a Web Animation of transform/translate/scale/opacity, so
   the phone's compositor plays it on its own thread. Without JavaScript, or
   with reduced motion, the invitation is simply shown open.
   ========================================================================== */
(() => {
  const section = document.getElementById('hiring');
  if (!section) return;

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inv = section.querySelector('.invite');
  const card = section.querySelector('.inv-card');
  const env = section.querySelector('.inv-env');
  const back = section.querySelector('.inv-back');
  const flapWrap = section.querySelector('.inv-flapwrap');
  const flap = section.querySelector('.inv-flap');
  const pocket = section.querySelector('.inv-pocket');
  const sealBtn = section.querySelector('.inv-seal');
  const halves = [...section.querySelectorAll('.inv-seal__half')];
  const EMAIL = (document.getElementById('cv-email') || {}).textContent || 'restaurantlaraza@gmail.com';
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- RSVP links: the role as the subject, a ready-made first line ---------- */
  section.querySelectorAll('[data-apply]').forEach((a) => {
    const role = a.dataset.apply;
    const subject = role || 'Application';
    const body = role
      ? `Hi La Raza team,\n\nI’d like to apply for the ${role} position. My CV is attached, along with contact details for two references.\n\n`
      : 'Hi La Raza team,\n\nI’d like to apply for the role of: \n\nMy CV is attached, along with contact details for two references.\n\n';
    a.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- copy the email (for phones without a mail app set up) ---------- */
  section.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.copy);
      const text = el ? el.textContent.trim() : '';
      const done = () => { btn.textContent = 'Copied'; btn.classList.add('is-done'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1600); };
      const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(text).then(done, select); } catch (e) { select(); }
    });
  });

  /* ---------- the pill on the main screen glides down here ---------- */
  const pill = document.getElementById('hire-open');
  if (pill) {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#hiring'); } catch (err) { /* sandboxed */ }
    });
  }

  /* ---------- the hero film rests while it's off screen ---------- */
  const hero = document.querySelector('.stage');
  const video = document.getElementById('bg');
  if (hero && video && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        delete video.dataset.offscreen;
        const swarm = document.getElementById('swarm');
        if (root.classList.contains('is-ready') && video.paused && (!swarm || swarm.hidden)) {
          const pr = video.play(); if (pr) pr.catch(() => {});
        }
      } else {
        video.dataset.offscreen = '1';
        video.pause();
      }
    }).observe(hero);
  }

  // The plain, open invitation is already readable; the envelope needs a modern browser
  const canAnimate = inv && card && env && Element.prototype.animate && CSS.supports && CSS.supports('translate', '0 1px') && CSS.supports('scale', '1');
  if (reduced || !canAnimate) return;

  /* ---------- sealed: the card tucked inside, the envelope centred ---------- */
  let state = 'open';
  let g = null;
  const moving = [back, flapWrap, pocket, sealBtn];

  function measure() {
    const Ch = card.offsetHeight, Cw = card.offsetWidth;
    const Eh = env.offsetHeight, Ew = env.offsetWidth;
    const H = inv.offsetHeight;                     // card + envelope, overlapping
    return {
      Ch, Eh, Ew, H,
      de: Eh / 2 - H / 2,                           // lift the envelope to the middle
      dc: H / 2 + Eh * .07 - Ch / 2,                // drop the card into it
      s0: Math.min(.8 * Ew / Cw, .74 * Eh / Ch),    // small enough to hide inside
    };
  }
  function applySealed() {
    g = measure();
    moving.forEach((el) => { el.style.translate = `0 ${g.de.toFixed(1)}px`; });
    card.style.translate = `0 ${g.dc.toFixed(1)}px`;
    card.style.scale = g.s0.toFixed(4);
  }
  function closeUp() {
    state = 'sealed';
    inv.classList.add('is-sealed');
    card.inert = true;
    sealBtn.setAttribute('aria-expanded', 'false');
    applySealed();
  }

  /* ---------- opening ---------- */
  let autoT = 0;
  function open() {
    if (state !== 'sealed') return;
    state = 'opening';
    clearTimeout(autoT);
    const G = g;
    const anims = [];
    const A = (el, kf, opt) => { const a = el.animate(kf, Object.assign({ fill: 'both' }, opt)); anims.push(a); return a; };

    inv.classList.add('is-opening');
    inv.classList.remove('is-sealed');
    card.inert = false;
    sealBtn.setAttribute('aria-expanded', 'true');

    // 1. The wax cracks and the halves drop away
    halves.forEach((h, k) => {
      const s = k ? 1 : -1;
      A(h, [
        { transform: 'none', opacity: 1 },
        { transform: `translate(${s * 5}px, -3px) rotate(${s * 9}deg)`, opacity: 1, offset: .22 },
        { transform: `translate(${s * 30}px, 54px) rotate(${s * 42}deg)`, opacity: 0 },
      ], { duration: 680, easing: 'cubic-bezier(.4,0,.6,1)' });
    });
    sparks();

    // 2. The flap swings open on its gold lining, tucking behind the card halfway round
    A(flap, [{ transform: 'perspective(900px) rotateX(0deg)' }, { transform: 'perspective(900px) rotateX(180deg)' }],
      { duration: 640, delay: 130, easing: 'cubic-bezier(.45,0,.25,1)' });
    A(flapWrap, [{ zIndex: 4 }, { zIndex: 4, offset: .5 }, { zIndex: 1, offset: .5 }, { zIndex: 1 }], { duration: 640, delay: 130 });

    // 3. The envelope settles as the card rises out of it
    const settle = { duration: 1150, delay: 500, easing: 'cubic-bezier(.3,.72,.2,1)' };
    [back, flapWrap, pocket].forEach((el) => A(el, [{ translate: `0 ${G.de}px` }, { translate: '0 0' }], settle));
    A(card, [
      { translate: `0 ${G.dc}px`, scale: G.s0, rotate: '0deg' },
      { translate: `0 ${(G.dc * .28).toFixed(1)}px`, scale: Math.min(1, (G.s0 + 1) / 2 + .06), rotate: '-2.5deg', offset: .55 },
      { translate: '0 0', scale: 1, rotate: '0deg' },
    ], Object.assign({}, settle, { easing: 'cubic-bezier(.25,.75,.2,1)' }));

    // 4. A few gold butterflies slip out
    setTimeout(() => birds(G), 620);

    // 5. Hand over to the plain open state
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);
    function finish() {
      if (state === 'open') return;
      state = 'open';
      moving.forEach((el) => { el.style.translate = ''; });
      card.style.translate = '';
      card.style.scale = '';
      inv.classList.remove('is-opening');
      anims.forEach((a) => a.cancel());
    }
  }

  // Gold sparks from the seal as it breaks
  function sparks() {
    const ir = inv.getBoundingClientRect();
    const sr = sealBtn.getBoundingClientRect();
    const cx = sr.left + sr.width / 2 - ir.left;
    const cy = sr.top + sr.height / 2 - ir.top;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('i');
      s.className = 'inv-fx inv-spark';
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      inv.appendChild(s);
      const a = (i / 12) * Math.PI * 2 + rnd(-.2, .2);
      const d = rnd(28, 62);
      const k = rnd(.6, 1.4);
      s.animate([
        { transform: 'translate(0, 0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * .45}px, ${Math.sin(a) * d * .45}px) scale(${k})`, opacity: 1, offset: .2 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 18}px) scale(.3)`, opacity: 0 },
      ], { duration: rnd(560, 820), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).finished.then(() => s.remove(), () => s.remove());
    }
  }

  // A handful of tiny butterflies flutter up out of the envelope
  function birds(G) {
    const W = inv.offsetWidth;
    const mouthY = (G.H - G.Eh) + G.de * .55 + G.Eh * .12;
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('span');
      b.className = 'inv-fx inv-bird';
      const x0 = W / 2 + rnd(-.22, .22) * G.Ew;
      b.style.left = x0 + 'px';
      b.style.top = mouthY + 'px';
      b.innerHTML = '<img src="assets/img/logo/emblem-gold.svg" alt="">';
      inv.appendChild(b);
      const side = x0 < W / 2 ? -1 : 1;
      const dx = side * rnd(.25, .6) * G.Ew;
      const dy = -rnd(.55, .95) * G.H;
      const r0 = side * rnd(10, 30);
      b.animate([
        { transform: `translate(0, 0) rotate(${r0}deg) scale(.35)`, opacity: 0 },
        { transform: `translate(${dx * .3}px, ${dy * .32}px) rotate(${-r0 * .6}deg) scale(1)`, opacity: 1, offset: .3 },
        { transform: `translate(${dx * .75}px, ${dy * .72}px) rotate(${r0 * .5}deg) scale(.9)`, opacity: 1, offset: .7 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${-r0 * .3}deg) scale(.7)`, opacity: 0 },
      ], { duration: rnd(1300, 1700), delay: i * 70, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' }).finished.then(() => b.remove(), () => b.remove());
      b.firstChild.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.25)' }],
        { duration: rnd(80, 105), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    }
  }

  /* ---------- when it opens ---------- */
  sealBtn.addEventListener('click', open);
  env.addEventListener('click', open);

  // Measure where the envelope actually is (its pieces move), not its resting spot
  const inView = () => { const r = back.getBoundingClientRect(); return r.top < innerHeight * .85 && r.bottom > innerHeight * .15; };
  closeUp();
  if (inView()) {
    // Arrived straight here (e.g. #hiring): let it be seen sealed for a beat, then open
    autoT = setTimeout(open, 900);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (state !== 'sealed') return;
      clearTimeout(autoT);
      if (e.isIntersecting) autoT = setTimeout(open, 750); // opens by itself if nobody breaks the seal
    }, { threshold: .55 }).observe(back);
  } else {
    open();
  }
  const reseal = () => { if (state === 'sealed') applySealed(); };
  addEventListener('resize', reseal, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reseal);
})();
