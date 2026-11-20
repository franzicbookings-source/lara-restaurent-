/* ==========================================================================
   LA RAZA — Coming Soon
   Waitlist form + small video housekeeping. No libraries.
   ========================================================================== */
(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Respect reduced motion: hold the video on its poster frame.
  const video = document.getElementById('bg');
  if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ticker: the page "talks" — one short line at a time under the headline.
  const ticker = document.getElementById('ticker');
  if (ticker && !reduced) {
    const lines = [...ticker.children];
    let i = 0;
    setTimeout(() => setInterval(() => {
      const cur = lines[i];
      i = (i + 1) % lines.length;
      const next = lines[i];
      cur.classList.remove('is-on'); cur.classList.add('is-out');
      next.classList.remove('is-out');
      void next.offsetWidth; // restart from below
      next.classList.add('is-on');
      setTimeout(() => cur.classList.remove('is-out'), 600);
    }, 2600), 1200);
  }

  // Countdown to opening night. Change data-opening on #countdown when the exact date is set.
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

  const form = document.getElementById('waitlist-form');
  if (!form) return;
  const msg = document.getElementById('form-msg');
  const btn = form.querySelector('button[type="submit"]');
  const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      say('Please enter a valid email address.', false);
      form.email.focus();
      return;
    }
    if (form.company && form.company.value) return; // honeypot

    btn.disabled = true;
    btn.textContent = 'Sending…';
    const data = new FormData(form);
    const endpoint = form.dataset.endpoint; // e.g. https://formspree.io/f/xxxx. Leave empty on Netlify.
    try {
      const res = endpoint
        ? await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        : await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
      if (!res.ok) throw new Error(String(res.status));
      form.email.value = '';
      btn.textContent = 'You’re in';
      say('Thanks! We’ll let you know the moment we open.', true);
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Get the invite';
      say('That didn’t go through. Try again, or message us on Instagram.', false);
    }
  });
})();
