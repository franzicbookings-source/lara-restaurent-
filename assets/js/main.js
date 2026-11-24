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

  /* ---------- Sign-up: email or WhatsApp number ---------- */
  const form = document.getElementById('waitlist-form');
  if (!form) return;
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type="submit"]');
  const input = document.getElementById('contact');
  const label = document.getElementById('contact-label');
  const choices = [...form.querySelectorAll('[data-via]')];
  let via = 'email';
  const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err'); };

  const MODES = {
    email: { type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'Your email', label: 'Your email' },
    whatsapp: { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: 'Your WhatsApp number', label: 'Your WhatsApp number' },
  };
  const choose = (next, focus) => {
    if (next === via && !focus) return;
    via = next;
    const m = MODES[via];
    choices.forEach((c) => c.setAttribute('aria-checked', String(c.dataset.via === via)));
    input.type = m.type; input.inputMode = m.inputmode; input.autocomplete = m.autocomplete;
    input.placeholder = m.placeholder; label.textContent = m.label;
    input.value = ''; say('', true);
    if (focus) input.focus();
  };
  choices.forEach((c) => c.addEventListener('click', () => choose(c.dataset.via, true)));
  form.querySelector('.via').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = via === 'email' ? 'whatsapp' : 'email';
    choose(next, false);
    form.querySelector(`[data-via="${next}"]`).focus();
  });

  const looksRight = (v) => via === 'email'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    : v.replace(/\D/g, '').length >= 9;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!looksRight(value)) {
      say(via === 'email' ? 'Please enter a valid email address.' : 'Please enter your WhatsApp number, like 082 123 4567.', false);
      input.focus();
      return;
    }
    if (form.company && form.company.value) return; // honeypot
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ via, value, from: 'home' }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'failed');
      input.value = '';
      btn.textContent = 'You’re in';
      say(via === 'email' ? 'Thank you. Your invite will come to your inbox.' : 'Thank you. Your invite will come on WhatsApp.', true);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Get the invite';
      say(err.message && err.message !== 'failed' ? err.message : 'That didn’t go through. Please try again.', false);
    }
  });
})();
