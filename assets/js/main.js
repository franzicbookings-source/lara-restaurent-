/* ==========================================================================
   LA RAZA — Grand opening, 2 December 2026
   The living invitation poster, gold dust, rotating line, countdown, subscribe. No libraries.
   The photo swarm intro lives in swarm.js and adds .is-ready when done.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Run something once the intro has handed over to the page.
  const whenReady = (fn) => {
    if (root.classList.contains('is-ready')) fn();
    else document.addEventListener('lr:ready', fn, { once: true });
  };
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

  /* ---------- Reserve on WhatsApp, and the opening in your calendar ---------- */
  const RESERVE = 'https://wa.me/27664079896?text=' + encodeURIComponent(
    'Hi La Raza! I’d like to reserve a table for the Grand Opening on Wednesday 2 December 2026.\n\nName:\nNumber of guests:');
  const CAL = apple ? 'assets/invite/la-raza-grand-opening.ics'
    : 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('La Raza · Grand Opening') +
      '&dates=20261202T160000Z/20261202T210000Z&details=' + encodeURIComponent('Sphe D’s Birthday Celebration. Reservations 066 407 9896. www.laraza.co.za') +
      '&location=' + encodeURIComponent('La Raza, Newcastle');
  ['reserve', 'reserve-back'].forEach((id) => { const a = document.getElementById(id); if (a) a.href = RESERVE; });
  ['cal', 'cal-back'].forEach((id) => {
    const a = document.getElementById(id); if (!a) return;
    a.href = CAL;
    if (!apple) { a.target = '_blank'; a.rel = 'noopener'; }
  });

  /* ---------- The invitation: tap the seal and it turns over ---------- */
  const card = document.getElementById('card');
  if (card) {
    const front = document.getElementById('card-front');
    const back = document.getElementById('card-back');
    const turnBack = document.getElementById('card-turn');
    const hint = document.getElementById('card-hint');
    const flip = (open) => {
      card.classList.toggle('is-flipped', open);
      card.classList.add('was-opened');
      back.toggleAttribute('inert', !open); back.setAttribute('aria-hidden', String(!open));
      front.toggleAttribute('inert', open); front.setAttribute('aria-hidden', String(open));
      if (hint) hint.lastChild.textContent = open ? 'Tap “Turn it back” to see the poster' : 'Tap the seal to open your invite';
      if (navigator.vibrate) navigator.vibrate(12);
      setTimeout(() => (open ? back.querySelector('a') : front).focus({ preventScroll: true }), reduced ? 0 : 650);
    };
    front.addEventListener('click', () => flip(true));
    turnBack.addEventListener('click', () => flip(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && card.classList.contains('is-flipped')) flip(false); });

    // Desktop: the poster leans toward the mouse and the light follows it
    if (finePointer && !reduced) {
      const tilt = document.getElementById('card-tilt');
      const art = card.parentElement;
      let raf = 0, tx = 0, ty = 0;
      art.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          tilt.style.setProperty('--ry', ((tx - .5) * 10).toFixed(2) + 'deg');
          tilt.style.setProperty('--rx', ((.5 - ty) * 8).toFixed(2) + 'deg');
          card.style.setProperty('--gx', (tx * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (ty * 100).toFixed(1) + '%');
          card.style.setProperty('--go', '1');
        });
      });
      art.addEventListener('pointerleave', () => {
        tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg'); card.style.setProperty('--go', '0');
      });
    }
  }

  /* ---------- Gold dust drifting through the room ---------- */
  const dust = document.getElementById('dust');
  if (dust && !reduced && dust.getContext) {
    const ctx = dust.getContext('2d');
    const N = finePointer ? 70 : 36;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, ps = [], on = true, last = 0;
    const size = () => {
      W = dust.clientWidth; H = dust.clientHeight;
      dust.width = Math.round(W * dpr); dust.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (anywhere) => ({
      x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10,
      r: .5 + Math.random() * 1.7, vy: 6 + Math.random() * 16, vx: -4 + Math.random() * 8,
      ph: Math.random() * Math.PI * 2, tw: .6 + Math.random() * 1.6,
    });
    size(); ps = Array.from({ length: N }, () => spawn(true));
    addEventListener('resize', size);
    const frame = (t) => {
      if (!on) return;
      const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y -= p.vy * dt; p.x += (p.vx + Math.sin(t / 1300 + p.ph) * 6) * dt;
        if (p.y < -10) Object.assign(p, spawn(false));
        const a = .25 + .55 * (.5 + .5 * Math.sin(t / 1000 * p.tw + p.ph));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(255,226,170,${a})`); g.addColorStop(.35, `rgba(234,190,120,${a * .45})`); g.addColorStop(1, 'rgba(234,190,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    };
    const run = (v) => { if (v && !on) { on = true; last = 0; requestAnimationFrame(frame); } else if (!v) on = false; };
    whenReady(() => requestAnimationFrame(frame));
    document.addEventListener('visibilitychange', () => run(!document.hidden));
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => run(e.isIntersecting && !document.hidden)).observe(dust);
  }

  /* ---------- Rotating line: the page "talks", one short line at a time ---------- */
  const ticker = document.getElementById('ticker');
  if (ticker && !reduced) {
    whenReady(() => {
      const lines = [...ticker.children];
      let i = 0;
      setInterval(() => {
        if (lines.length < 2) return;
        const cur = lines[i];
        i = (i + 1) % lines.length;
        const next = lines[i];
        cur.classList.remove('is-on'); cur.classList.add('is-out');
        next.classList.remove('is-out');
        void next.offsetWidth; // restart from below
        next.classList.add('is-on');
        setTimeout(() => cur.classList.remove('is-out'), 600);
      }, 2600);
    });
  }

  /* ---------- Countdown to the doors opening: Wednesday 2 December, 18:00 ---------- */
  const cd = document.getElementById('countdown');
  if (cd) {
    const label = document.getElementById('cd-label');
    const dateLine = document.getElementById('cd-date');
    const OPEN = Date.UTC(2026, 11, 2, 16, 0, 0); // 18:00 in South Africa
    const el = (u) => cd.querySelector(`[data-u="${u}"]`);
    const out = { d: el('d'), h: el('h'), m: el('m'), s: el('s') };
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      let t = Math.floor((OPEN - Date.now()) / 1000);
      if (t <= 0) {
        cd.classList.add('is-open'); label.hidden = true;
        dateLine.textContent = 'We’re open. Come and see us.';
        return false;
      }
      out.d.textContent = pad(Math.floor(t / 86400)); t %= 86400;
      out.h.textContent = pad(Math.floor(t / 3600)); t %= 3600;
      out.m.textContent = pad(Math.floor(t / 60));
      out.s.textContent = pad(t % 60);
      return true;
    };
    if (tick()) { const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000); }
  }

  /* ---------- Subscribe: one box takes an email or a WhatsApp number ---------- */
  const form = document.getElementById('waitlist-form');
  if (!form) return;
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type="submit"]');
  const input = document.getElementById('contact');
  const HINT = msg.textContent;
  const say = (text, cls) => { msg.textContent = text; msg.className = 'form__msg' + (cls ? ' ' + cls : ''); };

  // What did they type? An @ means email; otherwise enough digits means a WhatsApp number.
  const kind = (v) => (v.includes('@') ? 'email' : v.replace(/\D/g, '').length >= 9 && !/[a-z]/i.test(v) ? 'whatsapp' : '');
  input.addEventListener('input', () => {
    if (btn.disabled) return;
    const k = kind(input.value.trim());
    say(k === 'email' ? 'We’ll keep you posted by email.' : k === 'whatsapp' ? 'We’ll keep you posted on WhatsApp.' : HINT, k ? 'is-hint' : '');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.company && form.company.value) return; // honeypot
    const value = input.value.trim();
    const via = kind(value);
    if (via === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { say('That email doesn’t look right. Please check it.', 'is-err'); input.focus(); return; }
    if (!via) { say('Please enter your email, or your WhatsApp number like 082 123 4567.', 'is-err'); input.focus(); return; }
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ via, value, from: 'home' }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'failed');
      input.value = '';
      btn.textContent = 'Subscribed';
      say(via === 'email' ? 'You’re subscribed. We’ll keep you posted by email.' : 'You’re subscribed. We’ll keep you posted on WhatsApp.', 'is-ok');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Subscribe';
      say(err.message && err.message !== 'failed' ? err.message : 'That didn’t go through. Please try again.', 'is-err');
    }
  });
})();
