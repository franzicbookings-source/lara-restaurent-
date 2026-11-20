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
  const root = document.documentElement;

  /* ----------------------------------------------------------------------
     Photo swarm: tiles flutter in from all sides in 3D, gather into the
     La Raza butterfly, hold while the captions speak, then burst away.
     ---------------------------------------------------------------------- */
  // Butterfly formation, sampled from the emblem (x, y in -1..1).
  const BUTTERFLY = [[-.725,-.769],[-.55,-.769],[-.375,-.769],[.5,-.769],[.675,-.769],[-.8,-.59],[-.625,-.59],[-.45,-.59],[-.275,-.59],[.25,-.59],[.425,-.59],[.6,-.59],[.775,-.59],[-.55,-.41],[-.2,-.41],[-.025,-.41],[.15,-.41],[.5,-.41],[.675,-.41],[-.8,-.231],[-.625,-.231],[-.45,-.231],[-.275,-.231],[.25,-.231],[.425,-.231],[.6,-.231],[.775,-.231],[-.9,-.051],[-.725,-.051],[-.55,-.051],[-.375,-.051],[-.025,-.051],[.325,-.051],[.5,-.051],[.675,-.051],[.85,-.051],[-.45,.128],[-.1,.128],[.425,.128],[-.2,.308],[.15,.308],[-.275,.487],[.25,.487],[-.375,.667],[-.2,.667],[.15,.667],[.325,.667],[-.275,.846],[.25,.846]];
  const CAPTIONS = ['Consider this little taste of what’s to come.', 'Some things are better experienced than explained.'];

  const swarm = document.getElementById('swarm');
  let seen = false;
  try { seen = sessionStorage.getItem('lr-swarm') === '1'; } catch (_) {}
  const ready = () => root.classList.add('is-ready');

  if (!swarm || reduced || seen || !Element.prototype.animate) {
    if (swarm) swarm.remove();
    ready();
  } else {
    runSwarm();
  }

  function runSwarm() {
    const stage = document.getElementById('swarm-stage');
    const caption = document.getElementById('swarm-caption');
    const photos = swarm.dataset.photos.split(',').map((s) => s.trim()).filter(Boolean);
    const rect = stage.getBoundingClientRect();
    const half = { x: rect.width / 2, y: rect.height / 2 };
    const tile = Math.round(rect.width * 0.085);
    stage.style.setProperty('--tile', tile + 'px');
    const R = Math.max(innerWidth, innerHeight);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let finished = false;

    const tiles = BUTTERFLY.map(([bx, by], i) => {
      const el = document.createElement('div');
      el.className = 'swarm__tile';
      const img = new Image();
      img.src = photos[i % photos.length];
      img.alt = '';
      el.appendChild(img);
      stage.appendChild(el);
      const angle = rnd(0, Math.PI * 2);
      return {
        el,
        from: { x: Math.cos(angle) * R * rnd(.7, 1.1), y: Math.sin(angle) * R * rnd(.7, 1.1), z: rnd(-900, 300) },
        to: { x: bx * half.x, y: by * half.y, r: rnd(-10, 10) },
        delay: rnd(0, 520) + i * 6,
      };
    });

    const START = 950; // just as the emblem finishes drawing
    const GATHER = 1500;

    // 1. Fly in, fluttering, and settle into the butterfly
    tiles.forEach((t) => {
      const { from, to } = t;
      const mid = { x: (from.x + to.x) * 0.35 + rnd(-80, 80), y: (from.y + to.y) * 0.35 + rnd(-80, 80) };
      t.anim = t.el.animate([
        { opacity: 0, transform: `translate3d(${from.x}px, ${from.y}px, ${from.z}px) rotateX(${rnd(-80, 80)}deg) rotateY(${rnd(-180, 180)}deg) scale(.6)` },
        { opacity: 1, offset: .25, transform: `translate3d(${(from.x + mid.x) / 2}px, ${(from.y + mid.y) / 2}px, ${from.z * .5}px) rotateX(${rnd(-50, 50)}deg) rotateY(${rnd(-90, 90)}deg) scale(.8)` },
        { opacity: 1, offset: .6, transform: `translate3d(${mid.x}px, ${mid.y}px, ${rnd(-150, 150)}px) rotateX(${rnd(-25, 25)}deg) rotateY(${rnd(-60, 60)}deg) scale(.95)` },
        { opacity: 1, transform: `translate3d(${to.x}px, ${to.y}px, 0) rotate(${to.r}deg)` },
      ], { duration: GATHER, delay: START + t.delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    });

    // 2. The formed butterfly flaps its wings twice while the captions speak
    const settle = START + GATHER + 560;
    later(() => {
      stage.animate([
        { transform: 'rotateY(0deg) scale(1)' },
        { transform: 'rotateX(14deg) scale(1.03, .97)', offset: .25 },
        { transform: 'rotateY(0deg) scale(1)', offset: .5 },
        { transform: 'rotateX(14deg) scale(1.03, .97)', offset: .75 },
        { transform: 'rotateY(0deg) scale(1)' },
      ], { duration: 1500, easing: 'ease-in-out' });
      caption.textContent = CAPTIONS[0];
      caption.classList.add('is-on');
    }, settle - 200);
    later(() => {
      caption.classList.remove('is-on');
      later(() => { caption.textContent = CAPTIONS[1]; caption.classList.add('is-on'); }, 380);
    }, settle + 1300);

    // 3. Burst outward toward the viewer, then hand over to the page
    later(burst, settle + 3000);

    function burst() {
      caption.classList.remove('is-on');
      tiles.forEach((t) => {
        const { to } = t;
        const len = Math.hypot(to.x, to.y) || 1;
        const k = R / len * rnd(.8, 1.3);
        t.anim.cancel();
        t.el.animate([
          { opacity: 1, transform: `translate3d(${to.x}px, ${to.y}px, 0) rotate(${to.r}deg)` },
          { opacity: 0, transform: `translate3d(${to.x * k}px, ${to.y * k}px, ${rnd(200, 700)}px) rotateX(${rnd(-120, 120)}deg) rotateY(${rnd(-180, 180)}deg) scale(.8)` },
        ], { duration: rnd(700, 1000), delay: rnd(0, 160), easing: 'cubic-bezier(.55,0,.75,.2)', fill: 'forwards' });
      });
      later(finish, 650);
    }

    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      swarm.classList.add('is-done');
      ready();
      try { sessionStorage.setItem('lr-swarm', '1'); } catch (_) {}
      setTimeout(() => swarm.remove(), 700);
    }

    swarm.addEventListener('click', finish);
  }

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
