/* ==========================================================================
   LA RAZA — We're hiring (the stage)

   A dark stage with one empty chair per role. Everything here is tied to the
   scroll position, so it moves with your finger rather than jumping:
   - the main screen sinks and fades as the stage rises behind it;
   - "We're hiring." follows the main screen up without a gap;
   - a spotlight flickers on and glides from chair to chair;
   - each chair warms to gold as its role drifts onto the stage.
   Only transform and opacity change, and only when a value actually moves.

   Roles live in index.html (#hiring .act--role); chairs, count and the role
   buttons follow them. Without JavaScript, or with reduced motion, the roles
   simply sit one under another.
   ========================================================================== */
(() => {
  const scene = document.getElementById('hiring');
  if (!scene) return;

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = scene.querySelector('.casting__track');
  const stage = scene.querySelector('.casting__stage');
  const actsBox = scene.querySelector('.casting__acts');
  const beam = scene.querySelector('.casting__beam');
  const floor = scene.querySelector('.casting__floor');
  const chairsBox = scene.querySelector('.casting__chairs');
  const countEl = scene.querySelector('.casting__count');
  const countN = scene.querySelector('.casting__n');
  const countOf = scene.querySelector('.casting__of');
  const acts = [...scene.querySelectorAll('.act')];
  const roles = acts.filter((a) => a.classList.contains('act--role'));
  const EMAIL = (document.getElementById('cv-email') || {}).textContent || 'restaurantlaraza@gmail.com';
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const v = clamp((x - a) / (b - a)); return v * v * (3 - 2 * v); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- the count on the pill follows the roles ---------- */
  const pill = document.getElementById('hire-open');
  const count = document.getElementById('hire-count');
  const countSr = document.getElementById('hire-count-sr');
  if (count) count.textContent = roles.length;
  if (countSr) countSr.textContent = `: ${roles.length} open role${roles.length === 1 ? '' : 's'}`;
  if (countOf) countOf.textContent = ` / ${pad(roles.length)}`;

  /* ---------- Apply links: role as the subject, a ready-made first line ---------- */
  scene.querySelectorAll('[data-apply]').forEach((a) => {
    const name = a.dataset.apply;
    const body = `Hi La Raza team,\n\nI’d like to apply for the ${name} position. My CV is attached, along with contact details for two references.\n\n`;
    a.href = `mailto:${EMAIL}?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- copy the email (for phones without a mail app set up) ---------- */
  scene.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.copy);
      const text = el ? el.textContent.trim() : '';
      const done = () => { btn.textContent = 'Copied'; btn.classList.add('is-done'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1600); };
      const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(text).then(done, select); } catch (e) { select(); }
    });
  });

  /* ---------- the pill glides down to the stage ---------- */
  if (pill) {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const target = track ? track.getBoundingClientRect().top + scrollY : scene.offsetTop;
      scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' });
      try { history.replaceState(null, '', '#hiring'); } catch (err) { /* sandboxed */ }
    });
  }

  if (reduced || !track || !stage) return; // the plain stacked version is already readable

  /* ---------- build the stage ---------- */
  const CHAIR = '<svg viewBox="0 0 64 84"><path class="c-back" d="M15 12c0-6 34-6 34 0l2 32c0 6-38 6-38 0z"/><path class="c-seat" d="M8 44c0-5 48-5 48 0l-2 7c-1 5-43 5-44 0z"/><path class="c-legs" d="M15 54 11 82M49 54l4 28M25 55l-2 20M39 55l2 20"/></svg>';
  const chairs = roles.map((role, i) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.tabIndex = -1;
    c.className = 'chair';
    c.innerHTML = `<span class="chair__dark">${CHAIR}</span><span class="chair__gold">${CHAIR}</span>`;
    c.addEventListener('click', () => goTo(i + 1));
    chairsBox.appendChild(c);
    return { el: c, gold: c.querySelector('.chair__gold'), x: 0, g: -1 };
  });
  scene.classList.add('is-live');
  scene.style.setProperty('--acts', acts.length);
  // Resting points: the page settles on the main screen and on each turn of the stage
  const snaps = acts.map(() => { const m = document.createElement('i'); m.className = 'casting__snap'; m.setAttribute('aria-hidden', 'true'); track.appendChild(m); return m; });
  root.classList.add('has-snap');
  const state = acts.map(() => ({ o: -1, y: '', on: null }));

  /* ---------- layout: measured once, and again on resize ---------- */
  const hero = document.querySelector('.stage');
  const heroInner = hero && hero.querySelector('.center');
  let stageH = 0, heroH = 0, last = acts.length - 1;
  function layout() {
    stageH = stage.offsetHeight;
    // The act box is as tall as the tallest act, so the text and chairs sit together
    actsBox.style.height = '';
    let h = 0;
    acts.forEach((a) => { h = Math.max(h, a.offsetHeight); });
    actsBox.style.height = h + 'px';
    // Chair centres, relative to the middle of the stage
    const mid = stage.clientWidth / 2;
    chairs.forEach((c) => { c.x = chairsBox.offsetLeft + c.el.offsetLeft + c.el.offsetWidth / 2 - mid; });
    // The beam hangs from above the stage down to the seats
    const seat = chairsBox.offsetTop + (chairs[0] ? chairs[0].el.offsetHeight * .55 : 0);
    const top = -stageH * .06;
    beam.style.top = top + 'px';
    beam.style.height = (seat - top) + 'px';
    const bw = Math.round(Math.min(stage.clientWidth * .7, 340, (seat - top) * .8));
    beam.style.width = bw + 'px';
    beam.style.marginLeft = (-bw / 2) + 'px';
    heroH = hero ? hero.offsetHeight : 0;
    const total = track.offsetHeight - stageH;
    snaps.forEach((m, k) => { m.style.top = Math.round(total * (k / last)) + 'px'; });
    floor.style.top = (chairsBox.offsetTop + (chairs[0] ? chairs[0].el.offsetHeight : 0) - 18) + 'px';
    beamLen = seat - top;
    prev = {};
  }
  let beamLen = 1;
  let prev = {};
  const set = (el, key, prop, val) => { if (prev[key] !== val) { prev[key] = val; el.style[prop] = val; } };

  /* ---------- every frame the page scrolls ---------- */
  let lit = false;
  let ticking = false;
  function update() {
    ticking = false;
    const vh = innerHeight;

    // The main screen sinks and fades as you leave it (only once its bottom has been seen)
    if (heroInner) {
      const y = clamp((scrollY - Math.max(0, heroH - vh)) / vh, 0, 1.2);
      set(heroInner, 'hy', 'transform', y > 0 ? `translate3d(0, ${(y * vh * .28).toFixed(1)}px, 0) scale(${(1 - y * .05).toFixed(4)})` : '');
      set(heroInner, 'ho', 'opacity', y > 0 ? (1 - smooth(.05, .75, y)).toFixed(3) : '');
    }

    const r = track.getBoundingClientRect();
    if (r.bottom < -50 || r.top > vh + 50) return; // stage is off screen
    const total = r.height - stageH;
    const p = clamp(-r.top / total);
    const c = p * last;                                   // 0 = "We're hiring", 1..n = roles
    const enter = clamp(1 - r.top / stageH);              // 0 → 1 as the stage rises into place

    // Acts drift up through the stage and fade at the edges of their turn
    acts.forEach((a, k) => {
      let d = c - k;
      if (k === 0 && d < 0) d = 0;
      if (k === last && d > 0) d = 0;
      // A quick clean hand-over between turns; the page settles on each turn (scroll snap)
      let o = 1 - smooth(.16, .46, Math.abs(d));
      let y = -d * 84;
      if (k === 0) {                                      // follows the main screen up, no gap
        o *= smooth(.12, .6, enter);
        y += -(1 - enter) * stageH * .34;
      }
      o = Math.round(o * 100) / 100;
      const st = state[k];
      if (o !== st.o) { st.o = o; a.style.opacity = o; }
      const ty = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      if (ty !== st.y) { st.y = ty; a.style.transform = ty; }
      const on = o > .6;
      if (on !== st.on) { st.on = on; a.classList.toggle('is-on', on); if (on) a.removeAttribute('inert'); else a.setAttribute('inert', ''); }
    });

    // Chairs settle in as the stage arrives
    const ce = smooth(.45, 1, enter);
    set(chairsBox, 'co', 'opacity', ce.toFixed(3));
    set(chairsBox, 'cy', 'transform', `translate3d(0, ${((1 - ce) * 28).toFixed(1)}px, 0)`);

    // The spotlight: on just before the first role, then glides chair to chair
    const bo = smooth(.55, .85, c);
    if (!lit && c > .6) { lit = true; scene.classList.add('is-lit'); }
    let x = chairs.length ? chairs[0].x : 0;
    if (c > 1 && chairs.length > 1) {
      const k = Math.min(Math.floor(c), chairs.length - 1);
      const t = smooth(.3, .7, c - k);
      x = lerp(chairs[k - 1].x, chairs[Math.min(k, chairs.length - 1)].x, t);
    }
    const deg = -Math.atan2(x, beamLen) * 180 / Math.PI;
    set(beam, 'bt', 'transform', `rotate(${deg.toFixed(2)}deg)`);
    set(beam, 'bo', 'opacity', bo.toFixed(3));
    set(floor, 'ft', 'transform', `translate3d(${x.toFixed(1)}px, 0, 0)`);
    set(floor, 'fo', 'opacity', bo.toFixed(3));

    // Each chair warms to gold as its role takes the stage
    chairs.forEach((ch, j) => {
      const g = Math.round((1 - smooth(.25, .55, Math.abs(c - (j + 1)))) * 100) / 100;
      if (g !== ch.g) {
        ch.g = g;
        ch.gold.style.opacity = g;
        ch.el.style.transform = g ? `translate3d(0, ${(-6 * g).toFixed(1)}px, 0)` : '';
      }
    });

    // 01 / 04
    const n = clamp(Math.round(c), 1, roles.length);
    if (countN && countN.textContent !== pad(n)) countN.textContent = pad(n);
    set(countEl, 'no', 'opacity', bo.toFixed(3));
  }

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layout(); update(); }); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); update(); });

  function goTo(i) {
    const top = track.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + (track.offsetHeight - stageH) * (i / last), behavior: 'smooth' });
  }

  layout();
  update();

  /* ---------- the hero film rests while it's off screen ---------- */
  const video = document.getElementById('bg');
  if (hero && video && 'IntersectionObserver' in window) {
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
})();
