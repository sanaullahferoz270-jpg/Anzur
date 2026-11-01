/* =========================================================
   ANZUR PRODUCTION — interactions
   ========================================================= */
(() => {
  'use strict';

  /* ---------- CONFIG ----------
     To receive contact-form messages, paste a form endpoint here
     (e.g. a Formspree / Getform / Basin URL that accepts POST).   */
  const CONFIG = {
    formEndpoint: ''
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = mqReduce.matches;
  const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  if (reduced) root.classList.add('reduced');

  const hasGsap = typeof window.gsap !== 'undefined';
  const gsap = window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;

  /* ---------- year ---------- */
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------- smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ST ? ST.update : () => {});
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      scrollTo(el);
      history.replaceState(null, '', id);
      // move focus for keyboard users without jumping
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    });
  });

  /* ---------- video helpers ---------- */
  const playSafe = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

  // Hero video — choose portrait cut on phones
  const hero = $('.hero__video');
  if (hero) {
    const mob = isMobile();
    if (mob && hero.dataset.posterMobile) hero.poster = hero.dataset.posterMobile;
    hero.addEventListener('playing', () => hero.classList.add('is-playing'), { once: true });
    if (!reduced && !saveData) {
      hero.src = mob ? hero.dataset.srcMobile : hero.dataset.srcDesktop;
      hero.load();
      playSafe(hero);
    } else {
      hero.removeAttribute('autoplay');
    }
  }

  // Lazy background loops: load near viewport, play only while visible
  const lazyVideos = $$('video.lazy-video');
  if ('IntersectionObserver' in window) {
    const loader = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const v = en.target;
        if (!v.src && v.dataset.src && !saveData) { v.src = v.dataset.src; v.preload = 'auto'; }
        loader.unobserve(v);
      });
    }, { rootMargin: '400px 0px' });
    const player = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const v = en.target;
        if (en.isIntersecting && !reduced && v.src) playSafe(v);
        else if (!en.isIntersecting) v.pause();
      });
    }, { threshold: 0.15 });
    lazyVideos.forEach(v => { loader.observe(v); player.observe(v); });
  }
  // pause everything when tab hidden
  document.addEventListener('visibilitychange', () => {
    $$('video').forEach(v => { if (document.hidden) v.pause(); });
    if (!document.hidden && hero && !reduced && hero.src) playSafe(hero);
  });

  /* ---------- nav ---------- */
  const nav = $('[data-nav]');
  let lastY = 0;
  const onScroll = y => {
    nav.classList.toggle('is-solid', y > 40);
    const menuOpen = toggle.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', e => onScroll(e.scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  // active section link
  const links = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['work', 'services', 'about', 'team', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- mobile menu ---------- */
  const toggle = $('.nav__toggle');
  const menu = $('#menu');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    nav.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';
    lenis && lenis.stop();
    setTimeout(() => { const f = $('a', menu); f && f.focus(); }, 350);
  }
  function closeMenu() {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    lenis && lenis.start();
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900);
  }
  toggle.addEventListener('click', () => (toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu()));
  window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); });

  /* ---------- custom cursor ---------- */
  const cursor = $('.cursor');
  if (finePointer && !reduced && cursor) {
    root.classList.add('has-cursor');
    const label = $('.cursor__label', cursor);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const media = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, select, input, textarea, [role="slider"]');
      cursor.classList.toggle('is-media', !!media);
      cursor.classList.toggle('is-link', !media && !!link);
      if (media) label.textContent = media.dataset.cursor;
    });
    document.addEventListener('pointerleave', () => cursor.style.opacity = 0);
    document.addEventListener('pointerenter', () => cursor.style.opacity = 1);
  }

  /* ---------- statement words ---------- */
  const statement = $('[data-words]');
  if (statement) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    statement.setAttribute('aria-label', words.join(' '));
  }

  /* ---------- service hover preview ---------- */
  const preview = $('.svc-preview');
  if (preview && finePointer) {
    const pImg = $('img', preview);
    let px = 0, py = 0, tx = 0, ty = 0, raf = null;
    const follow = () => {
      px += (tx - px) * 0.14; py += (ty - py) * 0.14;
      preview.style.left = px + 'px'; preview.style.top = py + 'px';
      raf = requestAnimationFrame(follow);
    };
    $$('.svc__row').forEach(row => {
      row.addEventListener('pointerenter', e => {
        if (window.innerWidth < 1024) return;
        pImg.src = row.dataset.preview;
        preview.classList.toggle('is-tall', row.hasAttribute('data-tall'));
        tx = px = e.clientX + 30; ty = py = e.clientY - 120;
        preview.classList.add('is-on');
        if (!raf) follow();
      });
      row.addEventListener('pointermove', e => { tx = e.clientX + 30; ty = e.clientY - preview.offsetHeight / 2; });
      row.addEventListener('pointerleave', () => { preview.classList.remove('is-on'); });
    });
  }

  /* ---------- social reel sound ---------- */
  const soundBtn = $('.social__sound');
  if (soundBtn) {
    const v = $('.social__phone video');
    soundBtn.addEventListener('click', () => {
      if (!v.src) v.src = v.dataset.src;
      v.muted = !v.muted;
      if (!v.muted) playSafe(v);
      soundBtn.setAttribute('aria-pressed', String(!v.muted));
      soundBtn.setAttribute('aria-label', v.muted ? 'Turn sound on' : 'Turn sound off');
    });
  }

  /* ---------- brand word cycle ---------- */
  const bw = $('[data-brand-word]');
  if (bw && !reduced) {
    const list = ['Identity', 'Voice', 'Image', 'Presence'];
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % list.length;
      if (hasGsap) {
        gsap.to(bw, { yPercent: -20, opacity: 0, duration: .5, ease: 'power2.in', onComplete: () => {
          bw.textContent = list[i];
          gsap.fromTo(bw, { yPercent: 20, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'power3.out' });
        }});
      } else bw.textContent = list[i];
    }, 2800);
  }

  /* ---------- modal helpers ---------- */
  let lastFocus = null;
  const trap = (el, e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, [href], [tabindex]:not([tabindex="-1"])', el).filter(n => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ---------- showreel player ---------- */
  const pl = $('#player');
  const pv = $('.player__video', pl);
  const prog = $('.player__progress', pl);
  const progBar = $('i', prog);
  const tNow = $('[data-time]', pl), tDur = $('[data-dur]', pl);
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  let idleT = null;
  const wake = () => { pl.classList.remove('is-idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (!pv.paused) pl.classList.add('is-idle'); }, 2600); };

  function openReel() {
    lastFocus = document.activeElement;
    if (!pv.src) { pv.src = isMobile() ? pv.dataset.srcMobile : pv.dataset.srcDesktop; }
    pl.hidden = false;
    requestAnimationFrame(() => pl.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    lenis && lenis.stop();
    if (hero) hero.pause();
    pv.muted = false; pl.classList.remove('is-muted');
    pv.currentTime = 0;
    const p = pv.play();
    if (p && p.catch) p.catch(() => { pv.muted = true; pl.classList.add('is-muted'); playSafe(pv); });
    setTimeout(() => $('[data-act="play"]', pl).focus(), 100);
    wake();
  }
  function closeReel() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    pv.pause();
    pl.classList.remove('is-open');
    document.body.style.overflow = '';
    lenis && lenis.start();
    if (hero && !reduced && hero.src) playSafe(hero);
    setTimeout(() => { if (!pl.classList.contains('is-open')) pl.hidden = true; }, 600);
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  $$('[data-open-reel]').forEach(b => b.addEventListener('click', openReel));
  const togglePlay = () => (pv.paused ? playSafe(pv) : pv.pause());
  pl.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    wake();
    if (!b) { if (e.target === pv) togglePlay(); return; }
    const act = b.dataset.act;
    if (act === 'close') closeReel();
    if (act === 'play') togglePlay();
    if (act === 'mute') { pv.muted = !pv.muted; pl.classList.toggle('is-muted', pv.muted); b.setAttribute('aria-label', pv.muted ? 'Unmute' : 'Mute'); }
    if (act === 'fs') {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (pl.requestFullscreen) pl.requestFullscreen().catch(() => {});
      else if (pv.webkitEnterFullscreen) pv.webkitEnterFullscreen();
    }
  });
  pv.addEventListener('play', () => { pl.classList.remove('is-paused'); $('[data-act="play"]', pl).setAttribute('aria-label', 'Pause'); wake(); });
  pv.addEventListener('pause', () => { pl.classList.add('is-paused'); pl.classList.remove('is-idle'); $('[data-act="play"]', pl).setAttribute('aria-label', 'Play'); });
  pv.addEventListener('loadedmetadata', () => (tDur.textContent = fmt(pv.duration)));
  pv.addEventListener('timeupdate', () => {
    const r = pv.duration ? pv.currentTime / pv.duration : 0;
    progBar.style.transform = `scaleX(${r})`;
    tNow.textContent = fmt(pv.currentTime);
    prog.setAttribute('aria-valuenow', Math.round(r * 100));
  });
  pv.addEventListener('ended', () => pl.classList.add('is-paused'));
  const seekTo = clientX => { const r = prog.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width)); if (pv.duration) pv.currentTime = k * pv.duration; };
  let dragging = false;
  prog.addEventListener('pointerdown', e => { dragging = true; prog.setPointerCapture(e.pointerId); seekTo(e.clientX); });
  prog.addEventListener('pointermove', e => dragging && seekTo(e.clientX));
  prog.addEventListener('pointerup', () => (dragging = false));
  prog.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { pv.currentTime = Math.min(pv.duration || 0, pv.currentTime + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { pv.currentTime = Math.max(0, pv.currentTime - 5); e.preventDefault(); }
  });
  pl.addEventListener('pointermove', wake);
  pl.addEventListener('keydown', e => {
    wake();
    if (e.key === 'Escape' && !document.fullscreenElement) closeReel();
    if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); togglePlay(); }
    if (e.key === 'm') $('[data-act="mute"]', pl).click();
    trap(pl, e);
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  function openLb(src, alt) {
    lastFocus = document.activeElement;
    lbImg.src = src; lbImg.alt = alt || '';
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    lenis && lenis.stop();
    setTimeout(() => $('.lightbox__close', lb).focus(), 60);
  }
  function closeLb() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    lenis && lenis.start();
    setTimeout(() => { if (!lb.classList.contains('is-open')) { lb.hidden = true; lbImg.removeAttribute('src'); } }, 500);
    lastFocus && lastFocus.focus({ preventScroll: true });
  }
  $$('[data-lightbox]').forEach(b => b.addEventListener('click', () => openLb(b.dataset.lightbox, b.dataset.alt)));
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  lb.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); trap(lb, e); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); }
  });
  // keep keyboard focus inside the open menu (+ its close toggle)
  menu.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = [toggle, ...$$('a', menu)];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
  toggle.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey && toggle.getAttribute('aria-expanded') === 'true') { e.preventDefault(); $('a', menu).focus(); }
  });

  /* ---------- contact form ---------- */
  const form = $('#contact-form');
  if (form) {
    const status = $('.form__status', form);
    const sel = $('select', form);
    const syncSel = () => sel.classList.toggle('has-value', !!sel.value);
    sel.addEventListener('change', syncSel); syncSel();
    const rules = {
      name: v => v.trim().length > 1 || 'Please tell us your name.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: v => !v.trim() || /^[+()\d\s-]{6,20}$/.test(v.trim()) || 'Please enter a valid phone number.',
      project_type: v => !!v || 'Please choose a project type.',
      message: v => v.trim().length > 9 || 'A few more words about your project, please.'
    };
    const check = el => {
      const res = rules[el.name] ? rules[el.name](el.value) : true;
      const field = el.closest('.field');
      const ok = res === true;
      field.classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      $('.field__err', field).textContent = ok ? '' : res;
      return ok;
    };
    $$('input, textarea, select', form).forEach(el => el.addEventListener('blur', () => { if (el.value || el.closest('.is-invalid')) check(el); }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form__status'; status.textContent = '';
      const els = $$('input, textarea, select', form);
      const bad = els.filter(el => !check(el));
      if (bad.length) { bad[0].focus(); return; }
      const btn = $('button[type="submit"]', form);
      if (!CONFIG.formEndpoint) {
        console.warn('[ANZUR] Contact form endpoint not configured — set CONFIG.formEndpoint in assets/js/main.js');
        status.classList.add('is-err');
        status.textContent = 'Online enquiries are not connected yet. Please try again soon.';
        return;
      }
      btn.disabled = true; btn.style.opacity = .6;
      try {
        const res = await fetch(CONFIG.formEndpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error(res.status);
        form.reset(); syncSel();
        status.classList.add('is-ok');
        status.textContent = 'Thank you — your message has been sent. We will be in touch.';
      } catch (err) {
        status.classList.add('is-err');
        status.textContent = 'Something went wrong while sending. Please try again.';
      } finally { btn.disabled = false; btn.style.opacity = ''; }
    });
  }

  /* =========================================================
     MOTION (GSAP)
     ========================================================= */
  const curtain = $('.curtain');
  if (!hasGsap || reduced) {
    curtain && curtain.classList.add('is-done');
    if (statement) $$('.w', statement).forEach(w => (w.style.opacity = 1));
    return;
  }

  /* ---- intro ---- */
  const intro = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
  intro
    .from('.curtain__word span', { opacity: 0, y: 14, stagger: .12, duration: .9, ease: 'power3.out' })
    .to('.curtain__word', { opacity: 0, duration: .5, ease: 'power2.in' }, '+=.35')
    .to('.curtain__bar--top', { yPercent: -100, duration: 1.4 }, '<.1')
    .to('.curtain__bar--bottom', { yPercent: 100, duration: 1.4 }, '<')
    .add(() => curtain.classList.add('is-done'))
    .fromTo('.hero__media > *', { scale: 1.35 }, { scale: 1.12, duration: 2.6, ease: 'power3.out' }, '<-.2')
    .from('.hero__word', { yPercent: 110, duration: 1.5, stagger: .12, ease: 'expo.out' }, '<.5')
    .from('.hero__tag span', { opacity: 0, y: 12, stagger: .12, duration: .8, ease: 'power2.out' }, '<.3')
    .from('.hero__bottom', { opacity: 0, y: 24, duration: 1, ease: 'power3.out' }, '<.2')
    .from('.hero__meta, .hero__scroll, .nav', { opacity: 0, duration: 1, ease: 'power2.out' }, '<');

  /* ---- hero scroll parallax ---- */
  gsap.to('.hero__media', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  /* ---- statement words scrub ---- */
  if (statement) {
    gsap.to($$('.w', statement), {
      opacity: 1, stagger: .08, ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true }
    });
  }

  /* ---- titles ---- */
  $$('[data-reveal-title]').forEach(t => {
    gsap.from(t, { yPercent: 18, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: t, start: 'top 88%' } });
  });
  $$('.sec-head .eyebrow, .sec-note, .reel__sub, .social__lead, .social__points li, .contact__note').forEach(el => {
    gsap.from(el, { y: 26, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  /* ---- work reveal + inner parallax ---- */
  $$('.wk').forEach(w => {
    const frame = $('.wk__frame', w);
    const media = $('img, video', frame);
    gsap.fromTo(frame, { clipPath: 'inset(18% 8% 18% 8%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: w, start: 'top 85%' }
    });
    gsap.from($('.wk__info', w), { y: 20, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: w, start: 'top 75%' } });
    gsap.fromTo(media, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---- showreel ---- */
  gsap.fromTo('.reel__stage', { clipPath: 'inset(10% 12% 10% 12%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.reel', start: 'top 90%', end: 'top 25%', scrub: true }
  });
  gsap.fromTo('.reel__poster', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.reel', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---- services rows ---- */
  $$('.svc__row').forEach((r, i) => {
    gsap.from(r, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', delay: (i % 3) * .05, scrollTrigger: { trigger: r, start: 'top 92%' } });
  });

  const mm = gsap.matchMedia();

  /* ---- drone experience (3D tilt-in, pinned on desktop) ---- */
  mm.add('(min-width: 768px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.drone', start: 'top top', end: '+=140%', pin: '.drone__pin', scrub: 1, anticipatePin: 1 }
    });
    tl.fromTo('.drone__frame', { clipPath: 'inset(16% 22% 16% 22%)', rotateX: 16, scale: .94 }, { clipPath: 'inset(0% 0% 0% 0%)', rotateX: 0, scale: 1, ease: 'power2.inOut', duration: 1 })
      .fromTo('.drone__video', { scale: 1.3 }, { scale: 1.02, ease: 'none', duration: 1.6 }, 0)
      .from('.drone__title .line > span', { yPercent: 110, stagger: .12, duration: .6, ease: 'power3.out' }, .45)
      .from('.drone__copy .eyebrow, .drone__text', { opacity: 0, y: 20, duration: .5 }, .7)
      .from('.hud-c', { opacity: 0, scale: 1.6, stagger: .05, duration: .4 }, .6);
  });
  mm.add('(max-width: 767px)', () => {
    gsap.fromTo('.drone__frame', { clipPath: 'inset(10% 6% 10% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: '.drone', start: 'top 85%', end: 'top 10%', scrub: true } });
    gsap.from('.drone__title .line > span', { yPercent: 110, stagger: .12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.drone__title', start: 'top 85%' } });
  });

  /* ---- generic parallax images ---- */
  $$('[data-parallax]').forEach(img => {
    const k = parseFloat(img.dataset.parallax) || .1;
    gsap.fromTo(img, { yPercent: -k * 60 }, { yPercent: k * 60, ease: 'none', scrollTrigger: { trigger: img.closest('section') || img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  /* ---- about (brand section) ---- */
  (() => {
    const sec = $('#about');
    if (!sec) return;
    const media = $('.ab__media', sec), img = $('.ab__media img', sec);
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 72%' } });
    tl.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, '<.25')
      .from('.ab__frame-y', { scaleY: 0, duration: 1.1, ease: 'power3.inOut' }, '<.2')
      .from('.ab__frame-x', { scaleX: 0, duration: 1.1, ease: 'power3.inOut' }, '<.35')
      .from('.ab__inset', { y: 70, opacity: 0, duration: 1.3, ease: 'expo.out' }, '<.4')
      .from('.ab__caption span', { opacity: 0, y: 10, stagger: .1, duration: .8, ease: 'power2.out' }, '<.2');

    const copy = gsap.timeline({ scrollTrigger: { trigger: '.ab__copy', start: 'top 70%' } });
    copy.from('.ab__panel', { scaleX: 0, transformOrigin: 'right center', duration: 1.4, ease: 'expo.inOut' })
      .from('.ab__rule', { scaleY: 0, duration: 1.2, ease: 'expo.inOut' }, '<.2')
      .from('.ab__label', { opacity: 0, x: -16, duration: .8, ease: 'power3.out' }, '<.3')
      .from('.ab__title .line > span', { yPercent: 110, stagger: .1, duration: 1.2, ease: 'expo.out' }, '<.1')
      .from('.ab__text > *', { opacity: 0, y: 24, stagger: .12, duration: 1, ease: 'power3.out' }, '<.5')
      .from('.ab__pillars li', { opacity: 0, y: 20, stagger: .1, duration: .9, ease: 'power3.out' }, '<.3')
      .from('.ab__cta', { opacity: 0, y: 16, duration: .8, ease: 'power3.out' }, '<.3');

    // subtle parallax: image drifts inside its frame, inset moves against it
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.ab__inset', { yPercent: 18 }, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.ab__panel', { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
  })();


  /* ---- behind the frame ---- */
  $$('.btf__item').forEach((it, i) => {
    gsap.from(it, { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', delay: (i % 2) * .1, scrollTrigger: { trigger: it, start: 'top 92%' } });
  });
  mm.add('(min-width: 768px)', () => {
    $$('.btf__item').forEach(it => {
      const s = parseFloat(it.dataset.speed) || 0;
      gsap.to(it, { yPercent: -s * 100, ease: 'none', scrollTrigger: { trigger: '.btf__wall', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ---- social phone ---- */
  gsap.from('.social__phone', { y: 90, rotate: -4, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.social__stage', start: 'top 80%' } });

  /* ---- branding (navy · turquoise) ---- */
  (() => {
    const sec = $('#branding');
    if (!sec) return;
    gsap.from('.br__label', { opacity: 0, x: -20, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 75%' } });
    gsap.from('.br__title .line > span', { yPercent: 112, stagger: .14, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.br__title', start: 'top 85%' } });
    gsap.fromTo('.br__chevrons path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: .25, duration: 2.4, ease: 'power2.inOut', scrollTrigger: { trigger: sec, start: 'top 70%' } });

    const vis = gsap.timeline({ scrollTrigger: { trigger: '.br__visual', start: 'top 78%' } });
    vis.fromTo('.br__img--main', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
       .fromTo('.br__img--main img', { scale: 1.25 }, { scale: 1, duration: 2, ease: 'expo.out' }, '<.3')
       .fromTo('.br__frame', { clipPath: 'inset(0% 100% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, '<.2')
       .fromTo('.br__img--sub', { clipPath: 'inset(100% 0% 0% 0%)', y: 40 }, { clipPath: 'inset(0% 0% -40% 0%)', y: 0, duration: 1.3, ease: 'expo.out' }, '<.4')
       .from('.br__tag', { opacity: 0, y: 16, duration: .9, ease: 'power3.out' }, '<.3');

    const body = gsap.timeline({ scrollTrigger: { trigger: '.br__body', start: 'top 80%' } });
    body.from('.br__lead', { opacity: 0, y: 30, duration: 1.1, ease: 'power3.out' })
        .from('.br__list li', { opacity: 0, x: 24, stagger: .09, duration: .9, ease: 'power3.out' }, '<.25')
        .from('.br__cta', { opacity: 0, y: 18, duration: .8, ease: 'power3.out' }, '<.4');

    gsap.from('.br__tile', { opacity: 0, y: 40, stagger: .12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.br__system', start: 'top 88%' } });
    gsap.from('.br__swatches i', { scaleY: 0, transformOrigin: 'bottom', stagger: .07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.br__system', start: 'top 82%' } });

    // subtle parallax
    const st = { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true };
    gsap.fromTo('.br__img--main img', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: st });
    gsap.fromTo('.br__img--sub', { yPercent: 14 }, { yPercent: -14, ease: 'none', scrollTrigger: { ...st } });
    gsap.fromTo('.br__chevrons', { yPercent: -10 }, { yPercent: 14, ease: 'none', scrollTrigger: { ...st } });
    gsap.fromTo('.br__aperture', { rotate: -40 }, { rotate: 50, ease: 'none', scrollTrigger: { ...st } });
  })();

  /* ---- studio roles ---- */
  gsap.from('.studio__roles li', { y: 40, opacity: 0, stagger: .08, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.studio__roles', start: 'top 85%' } });

  /* ---- process: horizontal on desktop ---- */
  mm.add('(min-width: 768px)', () => {
    const track = $('.process__track');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + (dist() + window.innerHeight * .4), pin: '.process__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    tl.to(track, { x: () => -dist(), ease: 'none' }, 0)
      .to('.process__bar i', { scaleX: 1, ease: 'none' }, 0);
    $$('.step').forEach(s => {
      gsap.from($('img', s), { rotateY: -18, transformPerspective: 900, opacity: .3, ease: 'none',
        scrollTrigger: { trigger: s, containerAnimation: tl, start: 'left right', end: 'left 45%', scrub: true } });
    });
  });
  mm.add('(max-width: 767px)', () => {
    $$('.step').forEach(s => gsap.from(s, { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%' } }));
  });

  /* ---- contact & footer ---- */
  gsap.from('.form .field, .form__foot', { y: 30, opacity: 0, stagger: .07, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.form', start: 'top 85%' } });
  gsap.from('.footer__word span', { yPercent: 40, opacity: 0, stagger: .1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });

  // refresh once media sizes are known
  window.addEventListener('load', () => ST && ST.refresh());
})();
