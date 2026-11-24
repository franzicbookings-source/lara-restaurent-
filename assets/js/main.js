/* ==========================================================================
   LA RAZA — Coming Soon
   Rotating line, countdown, waitlist form. No libraries.
   The photo swarm intro lives in swarm.js and adds .is-ready when done.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // The background film loads only after the intro, so the first screen arrives fast.
  // Until then (and with reduced motion, always) the still photo shows behind it.
  const video = document.getElementById('bg');
  if (video) {
    video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
  }
  const startVideo = () => {
    if (!video || reduced || video.dataset.offscreen || !video.paused) return;
    const hero = video.closest('.stage');
    if (hero && hero.getBoundingClientRect().bottom <= 0) return; // starts when you scroll back up
    const p = video.play(); if (p) p.catch(() => {});
  };

  // Run something once the intro has handed over to the page.
  const whenReady = (fn) => {
    if (root.classList.contains('is-ready')) fn();
    else document.addEventListener('lr:ready', fn, { once: true });
  };

  whenReady(() => {
    const sw = document.getElementById('swarm');
    if (!sw || sw.hidden) setTimeout(startVideo, 300);
    else document.addEventListener('lr:intro-done', startVideo, { once: true });
  });

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

  /* ---------- Countdown to opening night (set data-opening on #countdown) ---------- */
  const cd = document.getElementById('countdown');
  if (cd) {
    const target = new Date(cd.dataset.opening).getTime();
    const el = (u) => cd.querySelector(`[data-u="${u}"]`);
    const out = { d: el('d'), h: el('h'), m: el('m'), s: el('s') };
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      let t = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (t === 0) {
        cd.classList.add('is-open');
        if (ticker) ticker.innerHTML = '<span class="ticker__line is-on">Now open. Come and see us.</span>';
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
