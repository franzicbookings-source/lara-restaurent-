/* ==========================================================================
   LA RAZA — We're hiring

   "Oh, and one more thing… we're hiring." A light section after the main
   screen: one card per role (swiped sideways on phones, side by side on
   desktop) and a row of chairs. The gold butterfly hops onto the chair of
   whichever role you're looking at, and that chair turns gold.

   No scroll-tracking: swiping and scrolling are the phone's own, and the
   butterfly and chairs move with CSS transitions (transform and opacity only),
   so it stays smooth on any phone.

   Roles live in index.html (#hiring .seat); chairs, dots and the pill's count
   follow them.
   ========================================================================== */
(() => {
  const section = document.getElementById('hiring');
  if (!section) return;

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rail = section.querySelector('.seats');
  const cards = [...section.querySelectorAll('.seat')];
  const row = section.querySelector('.chairs__row');
  const bird = section.querySelector('.chairs__bird');
  const dotsBox = section.querySelector('.seats__dots');
  const EMAIL = (document.getElementById('cv-email') || {}).textContent || 'restaurantlaraza@gmail.com';

  /* ---------- the count on the pill follows the roles ---------- */
  const pill = document.getElementById('hire-open');
  const count = document.getElementById('hire-count');
  const countSr = document.getElementById('hire-count-sr');
  if (count) count.textContent = cards.length;
  if (countSr) countSr.textContent = `: ${cards.length} open role${cards.length === 1 ? '' : 's'}`;

  /* ---------- Apply links: role as the subject, a ready-made first line ---------- */
  section.querySelectorAll('[data-apply]').forEach((a) => {
    const name = a.dataset.apply;
    const body = `Hi La Raza team,\n\nI’d like to apply for the ${name} position. My CV is attached, along with contact details for two references.\n\n`;
    a.href = `mailto:${EMAIL}?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
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

  /* ---------- the pill glides down to the section ---------- */
  if (pill) {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#hiring'); } catch (err) { /* sandboxed */ }
    });
  }

  /* ---------- chairs + dots, one per role ---------- */
  const CHAIR = '<svg viewBox="0 0 64 84"><path class="c-back" d="M15 12c0-6 34-6 34 0l2 32c0 6-38 6-38 0z"/><path class="c-seat" d="M8 44c0-5 48-5 48 0l-2 7c-1 5-43 5-44 0z"/><path class="c-legs" d="M15 54 11 82M49 54l4 28M25 55l-2 20M39 55l2 20"/></svg>';
  const chairs = cards.map((card, i) => {
    const c = document.createElement('button');
    c.type = 'button';
    c.tabIndex = -1;
    c.className = 'chair';
    c.style.setProperty('--i', i);
    c.innerHTML = `<span class="chair__dark">${CHAIR}</span><span class="chair__gold">${CHAIR}</span>`;
    c.addEventListener('click', () => go(i));
    if (row) row.appendChild(c);
    return c;
  });
  const dots = cards.map((card, i) => {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = 'seats__dot';
    d.setAttribute('aria-label', `Show ${card.dataset.role}`);
    d.addEventListener('click', () => go(i));
    if (dotsBox) dotsBox.appendChild(d);
    return d;
  });

  /* ---------- the butterfly hops to the active role's chair ---------- */
  let active = -1;
  function birdTo(i, hop) {
    if (!bird || !chairs[i]) return;
    const c = chairs[i];
    const x = c.offsetLeft + c.offsetWidth / 2 - bird.offsetWidth / 2;
    bird.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    if (hop && !reduced && bird.animate) {
      bird.animate([
        { translate: '0 0', rotate: '0deg' },
        { translate: '0 -26px', rotate: '-10deg', offset: .45 },
        { translate: '0 0', rotate: '0deg' },
      ], { duration: 520, easing: 'cubic-bezier(.3,.7,.3,1)' });
    }
  }
  function setActive(i, hop = true) {
    if (i === active || i < 0 || i >= cards.length) return;
    active = i;
    cards.forEach((c, k) => c.classList.toggle('is-on', k === i));
    chairs.forEach((c, k) => c.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
    birdTo(i, hop);
  }

  // Is the role list a sideways swiper (phones) or a grid (desktop)?
  const isRail = () => rail && rail.scrollWidth > rail.clientWidth + 4;

  function go(i) {
    if (isRail()) {
      const c = cards[i];
      rail.scrollTo({ left: c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    }
    setActive(i);
  }

  // Phones: whichever card is centred in the swiper is the active role
  if (rail && 'IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      if (!isRail()) return;
      entries.forEach((e) => seen.set(e.target, e.intersectionRatio));
      let best = -1, bestR = .55;
      cards.forEach((c, k) => { const r = seen.get(c) || 0; if (r > bestR) { bestR = r; best = k; } });
      if (best >= 0) setActive(best);
    }, { root: rail, threshold: [.55, .75, .95] });
    cards.forEach((c) => io.observe(c));
  }
  // Desktop: hovering or focusing a card picks it
  cards.forEach((c, k) => {
    c.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !isRail()) setActive(k); });
    c.addEventListener('focusin', () => { if (!isRail()) setActive(k); });
  });

  /* ---------- the chairs drop in when the section comes into view ---------- */
  setActive(0, false);
  addEventListener('resize', () => birdTo(active, false), { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => birdTo(active, false));
  if ('IntersectionObserver' in window && !reduced) {
    section.classList.add('is-waiting');
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      section.classList.remove('is-waiting');
      section.classList.add('is-in');
      birdTo(active, false);
    }, { threshold: .15 });
    io.observe(section);
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
})();
