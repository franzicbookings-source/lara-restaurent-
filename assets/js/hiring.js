/* ==========================================================================
   LA RAZA — We're hiring: an invitation

   "Oh, and one more thing… We're hiring." A cream envelope sealed with black
   wax and the gold emblem. Tap the seal (or just wait a moment): the wax
   cracks in two, the flap swings open on its gold lining, a few gold
   butterflies slip out and the card rises from the envelope:
   "La Raza requests the pleasure of your company & your CV."

   Every movement is a Web Animation of transform/translate/scale/opacity, so
   the phone's compositor plays it on its own thread. Without JavaScript, or
   with reduced motion, the invitation is simply shown open.
   ========================================================================== */
(() => {
  const section = document.getElementById('hiring');
  if (!section) return;

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inv = section.querySelector('.invite');
  const card = section.querySelector('.inv-card');
  const env = section.querySelector('.inv-env');
  const back = section.querySelector('.inv-back');
  const flapWrap = section.querySelector('.inv-flapwrap');
  const flap = section.querySelector('.inv-flap');
  const pocket = section.querySelector('.inv-pocket');
  const sealBtn = section.querySelector('.inv-seal');
  const halves = [...section.querySelectorAll('.inv-seal__half')];
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- Apply online: tap a role on the card, fill the form, attach the CV ---------- */
  const applyForm = document.getElementById('apply-form');
  if (applyForm) {
    const msg = document.getElementById('apply-msg');
    const sendBtn = applyForm.querySelector('button[type="submit"]');
    const fileIn = document.getElementById('ap-cv');
    const fileT = document.getElementById('ap-cv-t');
    const fileS = document.getElementById('ap-cv-s');
    const MAX = 4 * 1024 * 1024;
    const say = (text, ok) => { msg.textContent = text; msg.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err'); };
    const size = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

    section.querySelectorAll('[data-role]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const r = applyForm.querySelector(`input[name="role"][value="${a.dataset.role}"]`);
        if (r) r.checked = true;
        document.getElementById('apply').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => document.getElementById('ap-name').focus({ preventScroll: true }), reduced ? 0 : 600);
      });
    });

    fileIn.addEventListener('change', () => {
      const f = fileIn.files[0];
      fileT.textContent = f ? f.name : 'Attach your CV';
      fileS.textContent = f ? size(f.size) + ' · tap to change' : 'PDF, Word or a photo · up to 4 MB';
      fileIn.closest('.apply__file').classList.toggle('has-file', !!f);
    });

    // A big phone photo of a CV is shrunk before sending so it fits under 4 MB
    const shrink = (file) => new Promise((resolve) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= MAX * 0.9) return resolve(file);
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 2200 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob((b) => resolve(b ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', 0.82);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });

    applyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (applyForm.elements.company.value) return; // honeypot
      const $in = (id) => document.getElementById(id);
      const role = applyForm.querySelector('input[name="role"]:checked');
      const name = $in('ap-name').value.trim(), email = $in('ap-email').value.trim(), phone = $in('ap-phone').value.trim();
      let file = fileIn.files[0];
      const fail = (text, el) => { say(text, false); if (el) el.focus(); };
      if (!role) return fail('Please choose the role you’re applying for.', applyForm.querySelector('input[name="role"]'));
      if (name.length < 2) return fail('Please add your full name.', $in('ap-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('Please add a valid email address.', $in('ap-email'));
      if (phone.replace(/\D/g, '').length < 9) return fail('Please add your WhatsApp number, like 082 123 4567.', $in('ap-phone'));
      if (!file) return fail('Please attach your CV.', fileIn);
      sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; say('', true);
      file = await shrink(file);
      if (file.size > MAX) { sendBtn.disabled = false; sendBtn.textContent = 'Send my application'; return fail('Your CV is over 4 MB. Please attach a smaller file.', fileIn); }
      const data = new FormData();
      data.append('role', role.value); data.append('name', name); data.append('email', email); data.append('phone', phone);
      data.append('refs', $in('ap-refs').value.trim()); data.append('cv', file, file.name);
      try {
        const res = await fetch('/api/apply', { method: 'POST', body: data });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) throw new Error(out.error || 'failed');
        applyForm.reset(); fileIn.dispatchEvent(new Event('change'));
        sendBtn.textContent = 'Application sent';
        say(`Thank you, ${name.split(' ')[0]}. We’ve received your application for ${role.value} and will be in touch.`, true);
      } catch (err) {
        sendBtn.disabled = false; sendBtn.textContent = 'Send my application';
        say(err.message && err.message !== 'failed' ? err.message : 'That didn’t go through. Please try again.', false);
      }
    });
  }

  /* ---------- the paper and lining textures load once the invitation is close ---------- */
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { section.classList.add('is-near'); near.disconnect(); }
    }, { rootMargin: '50% 0px' });
    near.observe(section);
  } else {
    section.classList.add('is-near');
  }

  /* ---------- the pill and the little envelope on the main screen glide down here ---------- */
  ['hire-open', 'peek'].forEach((id) => {
    const link = document.getElementById(id);
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#hiring'); } catch (err) { /* sandboxed */ }
    });
  });

  // The scroll cue stays until the invitation itself is on screen
  const peek = document.getElementById('peek');
  if (peek && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      peek.classList.toggle('is-gone', e.isIntersecting || e.boundingClientRect.top < 0);
    }, { rootMargin: '0px 0px -50% 0px' }).observe(section); // leaves once the invitation fills half the screen
  }

  /* ---------- the hero film rests while it's off screen ---------- */
  const hero = document.querySelector('.stage');
  const video = document.getElementById('bg');
  if (hero && video && !reduced && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > 0) { // just touching the top edge doesn't count
        delete video.dataset.offscreen;
        const swarm = document.getElementById('swarm');
        if (root.classList.contains('is-ready') && video.paused && (!swarm || swarm.hidden)) {
          const pr = video.play(); if (pr) pr.catch(() => {});
        }
      } else {
        video.dataset.offscreen = '1';
        video.pause();
      }
    }, { threshold: [0, .01] }).observe(hero);
  }

  // The plain, open invitation is already readable; the envelope needs a modern browser
  const canAnimate = inv && card && env && Element.prototype.animate && CSS.supports && CSS.supports('translate', '0 1px') && CSS.supports('scale', '1');
  if (reduced || !canAnimate) return;

  /* ---------- sealed: the card tucked inside, the envelope centred ---------- */
  let state = 'open';
  let g = null;
  const moving = [back, flapWrap, pocket, sealBtn];

  function measure() {
    const Ch = card.offsetHeight, Cw = card.offsetWidth;
    const Eh = env.offsetHeight, Ew = env.offsetWidth;
    const H = inv.offsetHeight;                     // card + envelope, overlapping
    return {
      Ch, Eh, Ew, H,
      de: Eh / 2 - H / 2,                           // lift the envelope to the middle
      dc: H / 2 + Eh * .07 - Ch / 2,                // drop the card into it
      s0: Math.min(.8 * Ew / Cw, .74 * Eh / Ch),    // small enough to hide inside
    };
  }
  function applySealed() {
    g = measure();
    moving.forEach((el) => { el.style.translate = `0 ${g.de.toFixed(1)}px`; });
    card.style.translate = `0 ${g.dc.toFixed(1)}px`;
    card.style.scale = g.s0.toFixed(4);
  }
  function closeUp() {
    state = 'sealed';
    inv.classList.add('is-sealed');
    card.inert = true;
    sealBtn.setAttribute('aria-expanded', 'false');
    applySealed();
  }

  /* ---------- opening ---------- */
  let autoT = 0;
  function open() {
    if (state !== 'sealed') return;
    state = 'opening';
    clearTimeout(autoT);
    const G = g;
    const anims = [];
    const A = (el, kf, opt) => { const a = el.animate(kf, Object.assign({ fill: 'both' }, opt)); anims.push(a); return a; };

    inv.classList.add('is-opening');
    inv.classList.remove('is-sealed');
    card.inert = false;
    sealBtn.setAttribute('aria-expanded', 'true');

    // 1. The wax cracks and the halves drop away
    halves.forEach((h, k) => {
      const s = k ? 1 : -1;
      A(h, [
        { transform: 'none', opacity: 1 },
        { transform: `translate(${s * 5}px, -3px) rotate(${s * 9}deg)`, opacity: 1, offset: .22 },
        { transform: `translate(${s * 30}px, 54px) rotate(${s * 42}deg)`, opacity: 0 },
      ], { duration: 680, easing: 'cubic-bezier(.4,0,.6,1)' });
    });
    sparks();

    // 2. The flap swings open on its gold lining, tucking behind the card halfway round
    A(flap, [{ transform: 'perspective(900px) rotateX(0deg)' }, { transform: 'perspective(900px) rotateX(180deg)' }],
      { duration: 640, delay: 130, easing: 'cubic-bezier(.45,0,.25,1)' });
    A(flapWrap, [{ zIndex: 4 }, { zIndex: 4, offset: .5 }, { zIndex: 1, offset: .5 }, { zIndex: 1 }], { duration: 640, delay: 130 });

    // 3. The envelope settles as the card rises out of it
    const settle = { duration: 1150, delay: 500, easing: 'cubic-bezier(.3,.72,.2,1)' };
    [back, flapWrap, pocket].forEach((el) => A(el, [{ translate: `0 ${G.de}px` }, { translate: '0 0' }], settle));
    A(card, [
      { translate: `0 ${G.dc}px`, scale: G.s0, rotate: '0deg' },
      { translate: `0 ${(G.dc * .28).toFixed(1)}px`, scale: Math.min(1, (G.s0 + 1) / 2 + .06), rotate: '-2.5deg', offset: .55 },
      { translate: '0 0', scale: 1, rotate: '0deg' },
    ], Object.assign({}, settle, { easing: 'cubic-bezier(.25,.75,.2,1)' }));

    // 4. A few gold butterflies slip out
    setTimeout(() => birds(G), 620);

    // 5. Hand over to the plain open state
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);
    function finish() {
      if (state === 'open') return;
      state = 'open';
      moving.forEach((el) => { el.style.translate = ''; });
      card.style.translate = '';
      card.style.scale = '';
      inv.classList.remove('is-opening');
      anims.forEach((a) => a.cancel());
    }
  }

  // Gold sparks from the seal as it breaks
  function sparks() {
    const ir = inv.getBoundingClientRect();
    const sr = sealBtn.getBoundingClientRect();
    const cx = sr.left + sr.width / 2 - ir.left;
    const cy = sr.top + sr.height / 2 - ir.top;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('i');
      s.className = 'inv-fx inv-spark';
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      inv.appendChild(s);
      const a = (i / 12) * Math.PI * 2 + rnd(-.2, .2);
      const d = rnd(28, 62);
      const k = rnd(.6, 1.4);
      s.animate([
        { transform: 'translate(0, 0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * .45}px, ${Math.sin(a) * d * .45}px) scale(${k})`, opacity: 1, offset: .2 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 18}px) scale(.3)`, opacity: 0 },
      ], { duration: rnd(560, 820), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).finished.then(() => s.remove(), () => s.remove());
    }
  }

  // A handful of tiny butterflies flutter up out of the envelope
  function birds(G) {
    const W = inv.offsetWidth;
    const mouthY = (G.H - G.Eh) + G.de * .55 + G.Eh * .12;
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('span');
      b.className = 'inv-fx inv-bird';
      const x0 = W / 2 + rnd(-.22, .22) * G.Ew;
      b.style.left = x0 + 'px';
      b.style.top = mouthY + 'px';
      b.innerHTML = '<img src="assets/img/logo/emblem-gold.svg" alt="">';
      inv.appendChild(b);
      const side = x0 < W / 2 ? -1 : 1;
      const dx = side * rnd(.25, .6) * G.Ew;
      const dy = -rnd(.55, .95) * G.H;
      const r0 = side * rnd(10, 30);
      b.animate([
        { transform: `translate(0, 0) rotate(${r0}deg) scale(.35)`, opacity: 0 },
        { transform: `translate(${dx * .3}px, ${dy * .32}px) rotate(${-r0 * .6}deg) scale(1)`, opacity: 1, offset: .3 },
        { transform: `translate(${dx * .75}px, ${dy * .72}px) rotate(${r0 * .5}deg) scale(.9)`, opacity: 1, offset: .7 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${-r0 * .3}deg) scale(.7)`, opacity: 0 },
      ], { duration: rnd(1300, 1700), delay: i * 70, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' }).finished.then(() => b.remove(), () => b.remove());
      b.firstChild.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.25)' }],
        { duration: rnd(80, 105), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    }
  }

  /* ---------- when it opens ---------- */
  sealBtn.addEventListener('click', open);
  env.addEventListener('click', open);

  // Measure where the envelope actually is (its pieces move), not its resting spot
  const inView = () => { const r = back.getBoundingClientRect(); return r.top < innerHeight * .85 && r.bottom > innerHeight * .15; };
  closeUp();
  if (inView()) {
    // Arrived straight here (e.g. #hiring): let it be seen sealed for a beat, then open
    autoT = setTimeout(open, 900);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (state !== 'sealed') return;
      clearTimeout(autoT);
      if (e.intersectionRatio >= .35) autoT = setTimeout(open, 750); // opens by itself if nobody breaks the seal
    }, { threshold: [.35, .55] }).observe(back);
  } else {
    open();
  }
  const reseal = () => { if (state === 'sealed') applySealed(); };
  addEventListener('resize', reseal, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reseal);
})();
