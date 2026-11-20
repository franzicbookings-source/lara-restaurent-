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
      btn.textContent = 'Notify me';
      say('That didn’t go through. Try again, or message us on Instagram.', false);
    }
  });
})();
