/* ==========================================================================
   LA RAZA — We're hiring (the stage)

   A dark stage with one empty chair per role. Scroll and a spotlight flickers
   on, then swings from chair to chair; each chair it finds turns gold and its
   role takes the stage. Everything moves with transform and opacity only, and
   the scroll handler only touches the page when the role changes.

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
  const beam = scene.querySelector('.casting__beam');
  const floor = scene.querySelector('.casting__floor');
  const chairsBox = scene.querySelector('.casting__chairs');
  const countN = scene.querySelector('.casting__n');
  const countOf = scene.querySelector('.casting__of');
  const acts = [...scene.querySelectorAll('.act')];
  const roles = acts.filter((a) => a.classList.contains('act--role'));
  const EMAIL = (document.getElementById('cv-email') || {}).textContent || 'restaurantlaraza@gmail.com';
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

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
      scene.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
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
    c.style.setProperty('--i', i);
    c.innerHTML = `<span class="chair__dark">${CHAIR}</span><span class="chair__gold">${CHAIR}</span>`;
    c.addEventListener('click', () => goTo(i + 1));
    chairsBox.appendChild(c);
    return c;
  });
  scene.classList.add('is-live');
  scene.style.setProperty('--acts', acts.length);

  /* ---------- aim the spotlight ---------- */
  let current = -1;
  let lit = false;
  function aim(i) {
    if (i < 1) return;
    const c = chairs[i - 1].getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const dx = c.left + c.width / 2 - (s.left + s.width / 2);
    const len = Math.max(1, beam.offsetHeight);
    const deg = -Math.atan2(dx, len) * 180 / Math.PI;
    beam.style.transform = `rotate(${deg.toFixed(2)}deg)`;
    floor.style.transform = `translate3d(${dx.toFixed(1)}px, 0, 0)`;
  }

  function show(i) {
    if (i === current) return;
    current = i;
    acts.forEach((a, k) => {
      a.classList.toggle('is-on', k === i);
      a.classList.toggle('is-past', k < i);
      if (k === i) a.removeAttribute('inert'); else a.setAttribute('inert', '');
    });
    chairs.forEach((c, k) => c.classList.toggle('is-on', k === i - 1));
    if (i >= 1) {
      aim(i);
      if (!lit) { lit = true; scene.classList.add('is-lit'); } // first time: the light flickers on
      if (countN) countN.textContent = pad(i);
    }
    scene.classList.toggle('is-roles', i >= 1);
  }

  /* ---------- scroll → which act is on stage ---------- */
  let ticking = false;
  function measure() {
    ticking = false;
    const r = track.getBoundingClientRect();
    const total = r.height - innerHeight;
    if (total <= 0) return;
    const p = clamp(-r.top / total, 0, .9999);
    show(Math.floor(p * acts.length));
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(measure); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { const c = current; current = -1; measure(); if (current === -1) show(c); else aim(current); }, { passive: true });

  function goTo(i) {
    const top = track.getBoundingClientRect().top + scrollY;
    const total = track.offsetHeight - innerHeight;
    scrollTo({ top: top + total * ((i + .5) / acts.length), behavior: 'smooth' });
  }

  show(0);
  measure();

  /* ---------- the hero film rests while it's off screen ---------- */
  const hero = document.querySelector('.stage');
  const video = document.getElementById('bg');
  if (hero && video && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        delete video.dataset.offscreen;
        if (root.classList.contains('is-ready') && video.paused && (document.getElementById('swarm') || {}).hidden !== false) {
          const pr = video.play(); if (pr) pr.catch(() => {});
        }
      } else {
        video.dataset.offscreen = '1';
        video.pause();
      }
    }).observe(hero);
  }
})();
