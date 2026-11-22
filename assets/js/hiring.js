/* ==========================================================================
   LA RAZA — We're hiring (pull-up panel)

   The pill on the main screen opens a panel of open roles. A gold butterfly
   flies from the pill into the panel's header, and there's one chair per role:
   open a role and its chair turns gold. Apply opens an email with the role as
   the subject. The panel also opens straight from a link ending in #hiring,
   and the phone's back button closes it.

   Roles live in index.html (#hiring .role); the count and chairs follow them.
   ========================================================================== */
(() => {
  const sheet = document.getElementById('hiring');
  const opener = document.getElementById('hire-open');
  if (!sheet || !opener) return;

  const root = document.documentElement;
  const panel = sheet.querySelector('.sheet__panel');
  const emblem = sheet.querySelector('.sheet__emblem');
  const chairsBox = sheet.querySelector('.chairs');
  const roles = [...sheet.querySelectorAll('.role')];
  const video = document.getElementById('bg');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HASH = '#hiring';
  const EMAIL = (document.getElementById('cv-email') || {}).textContent || 'restaurantlaraza@gmail.com';

  /* ---------- count + chairs follow the roles in the markup ---------- */
  const count = document.getElementById('hire-count');
  const countSr = document.getElementById('hire-count-sr');
  if (count) count.textContent = roles.length;
  if (countSr) countSr.textContent = `: ${roles.length} open role${roles.length === 1 ? '' : 's'}`;

  const CHAIR = '<svg viewBox="0 0 32 40"><path class="c-back" d="M7 21V10a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v11"/><path class="c-seat" d="M4 21h24v3a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path class="c-legs" d="M9 27 7 38M23 27l2 11M13 27l-1 8M19 27l1 8"/></svg>';
  const chairs = roles.map((role, i) => {
    const c = document.createElement('span');
    c.className = 'chair';
    c.style.setProperty('--i', i);
    c.innerHTML = CHAIR;
    c.addEventListener('click', () => toggle(i, true));
    chairsBox && chairsBox.appendChild(c);
    return c;
  });

  /* ---------- Apply links: the role as the subject, a ready-made first line ---------- */
  roles.forEach((role) => {
    const name = role.dataset.role;
    const a = role.querySelector('.role__apply');
    if (!a) return;
    const body = `Hi La Raza team,\n\nI’d like to apply for the ${name} position. My CV is attached, along with contact details for two references.\n\n`;
    a.href = `mailto:${EMAIL}?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- roles: one open at a time ---------- */
  function toggle(i, forceOpen) {
    roles.forEach((role, k) => {
      const head = role.querySelector('.role__head');
      const body = role.querySelector('.role__body');
      const open = k === i ? (forceOpen ? true : head.getAttribute('aria-expanded') !== 'true') : false;
      head.setAttribute('aria-expanded', String(open));
      role.classList.toggle('is-open', open);
      chairs[k] && chairs[k].classList.toggle('is-on', open);
      if (open) body.removeAttribute('inert'); else body.setAttribute('inert', '');
    });
  }
  roles.forEach((role, i) => role.querySelector('.role__head').addEventListener('click', () => toggle(i)));

  /* ---------- copy the email (some phones have no mail app set up) ---------- */
  sheet.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.copy);
      const text = el ? el.textContent.trim() : '';
      const done = () => { btn.textContent = 'Copied'; btn.classList.add('is-done'); setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1600); };
      const select = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try {
        navigator.clipboard.writeText(text).then(done, select);
      } catch (e) { select(); }
    });
  });

  /* ---------- open / close ---------- */
  let isOpen = false;
  let pushedHash = false;
  let lastFocus = null;
  let closeTimer = 0;

  function flyButterfly() {
    if (reduced || !emblem || !Element.prototype.animate) return;
    // Where the emblem will rest once the panel is up: measure with the panel in place, unanimated
    sheet.classList.add('is-measuring', 'is-open');
    const to = emblem.getBoundingClientRect();
    sheet.classList.remove('is-open');
    void sheet.offsetWidth; // settle back to closed before transitions switch on again
    sheet.classList.remove('is-measuring');
    const dot = opener.querySelector('.hire__dot') || opener;
    const from = dot.getBoundingClientRect();

    const bird = emblem.cloneNode();
    bird.className = 'sheet__fly';
    bird.style.width = to.width + 'px';
    bird.style.height = to.height + 'px';
    document.body.appendChild(bird);
    const fx = from.left + from.width / 2 - to.width / 2;
    const fy = from.top + from.height / 2 - to.height / 2;
    const mx = (fx + to.left) / 2 + (to.left > fx ? -60 : 60);
    const my = Math.min(fy, to.top) - 40;
    const anim = bird.animate([
      { transform: `translate3d(${fx}px, ${fy}px, 0) scale(.25) rotate(-25deg)`, opacity: 0 },
      { transform: `translate3d(${mx}px, ${my}px, 0) scale(.8) rotate(12deg)`, opacity: 1, offset: .55 },
      { transform: `translate3d(${to.left}px, ${to.top}px, 0) scale(1) rotate(0deg)`, opacity: 1 },
    ], { duration: 760, easing: 'cubic-bezier(.3,.7,.2,1)' });
    emblem.classList.add('is-waiting');
    anim.onfinish = anim.oncancel = () => { emblem.classList.remove('is-waiting'); bird.remove(); };
  }

  function open(fromHash) {
    if (isOpen) return;
    isOpen = true;
    clearTimeout(closeTimer);
    lastFocus = document.activeElement;
    sheet.hidden = false;
    panel.scrollTop = 0;
    flyButterfly();
    void sheet.offsetWidth; // start from the closed position
    sheet.classList.add('is-open');
    root.classList.add('has-sheet');
    if (video && !video.paused) { video.pause(); video.dataset.sheetPaused = '1'; }
    panel.focus({ preventScroll: true });
    if (!fromHash && location.hash !== HASH) {
      try { location.hash = HASH.slice(1); pushedHash = true; } catch (e) { /* sandboxed */ }
    }
  }

  function close(fromHash) {
    if (!isOpen) return;
    isOpen = false;
    sheet.classList.remove('is-open');
    root.classList.remove('has-sheet');
    panel.style.transform = '';
    closeTimer = setTimeout(() => { sheet.hidden = true; toggle(-1); }, reduced ? 0 : 520);
    if (video && video.dataset.sheetPaused) { delete video.dataset.sheetPaused; const p = video.play(); if (p) p.catch(() => {}); }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (!fromHash && location.hash === HASH) {
      if (pushedHash) { pushedHash = false; history.back(); }
      else { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }
    }
  }

  opener.addEventListener('click', () => open(false));
  sheet.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => close(false)));
  addEventListener('hashchange', () => { if (location.hash === HASH) open(true); else close(true); });

  // Keyboard: Esc closes, Tab stays inside the panel
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(false); return; }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.closest('[inert]') && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- swipe down to close (phones) ---------- */
  let startY = 0, dy = 0, dragging = false, startT = 0;
  panel.addEventListener('touchstart', (e) => {
    if (panel.scrollTop > 0 || e.touches.length > 1) return;
    startY = e.touches[0].clientY; startT = performance.now(); dy = 0; dragging = true;
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    dy = e.touches[0].clientY - startY;
    if (dy <= 0 || panel.scrollTop > 0) { if (dy < 0) dragging = false; panel.style.transform = ''; return; }
    e.preventDefault();
    sheet.classList.add('is-dragging');
    panel.style.transform = `translate3d(0, ${dy}px, 0)`;
  }, { passive: false });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('is-dragging');
    const fast = dy > 40 && dy / (performance.now() - startT) > .6;
    if (dy > 110 || fast) close(false);
    else panel.style.transform = '';
  };
  panel.addEventListener('touchend', endDrag);
  panel.addEventListener('touchcancel', endDrag);

  /* ---------- a link ending in #hiring opens it once the intro hands over ---------- */
  if (location.hash === HASH) {
    const go = () => setTimeout(() => open(true), 350);
    if (root.classList.contains('is-ready')) go();
    else document.addEventListener('lr:ready', go, { once: true });
  }
})();
