/* ==========================================================================
   LA RAZA — Coming Soon · Interaction & motion
   GSAP + ScrollTrigger + Lenis (vendored). Progressive enhancement:
   without JS (or if libraries fail) the page renders fully, statically.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  // Fallback: no animation libraries → static page
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.replace('js', 'no-js');
    initForm();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  if (reduced) root.classList.add('reduced');

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  /* ---------- Hero: initial states ---------- */
  const heroLines = $$('[data-hero-line]');
  const heroFades = $$('[data-hero-fade]');
  const heroVideo = $('#hero-video');
  const header = $('#header');

  function playHeroIn(delay = 0) {
    const tl = gsap.timeline({ delay });
    tl.fromTo('#hero-media', { scale: 1.18 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0)
      .fromTo(heroLines, { yPercent: 110 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12 }, 0.15)
      .fromTo(heroFades, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, 0.55)
      .fromTo(header, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' }, 0.6);
    return tl;
  }

  /* ---------- Intro (La Raza Motion, rebuilt in code) ---------- */
  const intro = $('#intro');
  let seen = false;
  try { seen = sessionStorage.getItem('lr-intro') === '1'; } catch (_) { /* storage blocked */ }

  if (!intro || reduced || seen) {
    intro && intro.remove();
    playHeroIn(0.05);
  } else {
    lenis && lenis.stop();
    gsap.set(header, { autoAlpha: 0 });
    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroFades, { autoAlpha: 0 });
    const counter = { v: 0 };
    const countEl = $('#intro-count');
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        intro.remove();
        lenis && lenis.start();
        try { sessionStorage.setItem('lr-intro', '1'); } catch (_) {}
      },
    });
    tl.to('.intro__emblem .stroke', { strokeDashoffset: 0, duration: 2.1, ease: 'power1.inOut' }, 0.2)
      .to(counter, { v: 100, duration: 2.9, ease: 'power1.inOut', onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0.2)
      .to('.intro__emblem .fill', { opacity: 1, duration: 0.9 }, 1.85)
      .to('.intro__emblem .stroke', { opacity: 0, duration: 0.6 }, 2.2)
      .to('.intro__word', { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, ease: 'expo.out' }, 1.9)
      .to('.intro__mark', { scale: 0.94, duration: 0.8, ease: 'power3.in' }, 3.2)
      .to(intro, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.15, ease: 'expo.inOut' }, 3.45)
      .add(playHeroIn(0), 3.75);
    gsap.set(intro, { clipPath: 'inset(0% 0% 0% 0%)' });
  }

  /* ---------- Header: hide on scroll down, show on up ---------- */
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.6);
      lastY = y;
    },
  });

  /* ---------- Video: only play what's on screen ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach(({ target, isIntersecting }) => {
    if (reduced) { target.pause(); return; }
    if (isIntersecting) target.play().catch(() => {}); else target.pause();
  }), { threshold: 0.05 });
  $$('video').forEach((v) => io.observe(v));

  /* ---------- Generic reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });

  /* ---------- Manifesto: word-by-word gilding ---------- */
  const mText = $('#manifesto-text');
  if (mText) {
    splitWords(mText);
    gsap.to($$('.w', mText), {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: mText, start: 'top 80%', end: 'bottom 45%', scrub: reduced ? false : 0.6 },
    });
  }

  /* ---------- Pillars: line-drawn illustrations ---------- */
  $$('.pillar').forEach((row) => {
    const strokes = $$('[pathLength]', row);
    gsap.to(strokes, {
      strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.06,
      scrollTrigger: { trigger: row, start: 'top 82%' },
    });
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px) and (prefers-reduced-motion: no-preference)', () => {
    /* Hero → arch: the doorway closes into the brand's arch as you scroll */
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=85%', scrub: 0.8, pin: true, anticipatePin: 1 } })
      .fromTo('#hero-media',
        { clipPath: 'inset(0% 0% 0% 0% round 0vw 0vw 0vw 0vw)' },
        { clipPath: 'inset(9% 31% 0% 31% round 19vw 19vw 0vw 0vw)', ease: 'none' }, 0)
      .to('#hero-content', { yPercent: -18, autoAlpha: 0, ease: 'none' }, 0)
      .to('.hero__foot', { autoAlpha: 0, ease: 'none', duration: 0.3 }, 0);

    /* Smala-style drift: rows slide against each other */
    const drift = [['-9vw', '2vw'], ['12vw', '1vw'], ['-4vw', '7vw']];
    $$('.pillar__inner').forEach((el, i) => {
      gsap.fromTo(el, { x: drift[i][0] }, {
        x: drift[i][1], ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
    });

    /* Arch grows and the footage drifts inside it */
    gsap.fromTo('#arch', { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#arch', start: 'top bottom', end: 'center center', scrub: 1 } });
    gsap.fromTo('#arch video', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '#arch', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* Footer: the wordmark writes itself in */
  gsap.fromTo('#footer-big svg', { clipPath: 'inset(0% 100% 0% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', ease: reduced ? 'none' : 'power2.out', duration: reduced ? 0 : 1.8,
    scrollTrigger: { trigger: '#footer-big', start: 'top 92%' },
  });

  /* ---------- Cursor, magnetic buttons, image reveal (desktop) ---------- */
  if (finePointer && !reduced) {
    root.classList.add('has-cursor');
    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { cursor.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });

    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, .pillar, input');
      cursor.classList.toggle('is-label', !!lab);
      label.textContent = lab ? lab.dataset.cursor : '';
      cursor.classList.toggle('is-hover', !lab && !!hov);
    });

    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.36);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });

    // Floating photograph over the pillar rows
    const box = $('#reveal-img');
    const imgs = $$('img', box);
    const bx = gsap.quickTo(box, 'x', { duration: 0.7, ease: 'power3.out' });
    const by = gsap.quickTo(box, 'y', { duration: 0.7, ease: 'power3.out' });
    let lastX = 0;
    $$('.pillar').forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        imgs.forEach((im, i) => im.classList.toggle('is-active', i === +row.dataset.img));
        gsap.set(box, { x: e.clientX, y: e.clientY });
        gsap.to(box, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      });
      row.addEventListener('pointermove', (e) => {
        bx(e.clientX); by(e.clientY);
        gsap.to(box, { rotation: gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4), duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
        lastX = e.clientX;
      });
      row.addEventListener('pointerleave', () => gsap.to(box, { autoAlpha: 0, scale: 0.85, rotation: 0, duration: 0.5, ease: 'expo.out', overwrite: 'auto' }));
    });
    gsap.set(box, { xPercent: -50, yPercent: -50, scale: 0.85, autoAlpha: 0 });
  }

  initForm();

  /* ======================================================================
     Helpers
     ====================================================================== */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.tagName === 'EM') { n.classList.add('w'); } else walk(n);
        }
      });
    };
    walk(el);
  }

  function initForm() {
    const form = document.getElementById('waitlist-form');
    if (!form) return;
    const msg = document.getElementById('form-msg');
    const btn = form.querySelector('button[type="submit"]');
    const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err'); };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say('Please enter a valid email address.', false); form.email.focus(); return; }
      if (form.company && form.company.value) return; // honeypot

      btn.disabled = true; btn.firstChild.textContent = 'Joining… ';
      const data = new FormData(form);
      const endpoint = form.dataset.endpoint; // e.g. https://formspree.io/f/xxxx — leave empty on Netlify
      try {
        const res = endpoint
          ? await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          : await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
        if (!res.ok) throw new Error(res.status);
        form.classList.add('is-done');
        form.email.value = '';
        btn.firstChild.textContent = 'You’re on the list ';
        say('Welcome to La Raza. Watch your inbox for the big reveal. ✦', true);
      } catch (err) {
        btn.disabled = false; btn.firstChild.textContent = 'Join the list ';
        say('We couldn’t save that just now. Please try again, or message us on Instagram.', false);
      }
    });
  }
})();
