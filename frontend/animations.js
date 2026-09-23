/**
 * ManuMan Mobility — scroll animation engine (vanilla JS, no dependencies).
 *
 * Usage:
 *   <section class="reveal fade-up">…</section>                      single element
 *   <div class="reveal-group" data-stagger="120">…cards…</div>       children stagger in
 *   <div class="reveal-clip"><img class="reveal-clip-img" …></div>   cinematic image reveal
 *   <section class="parallax" data-parallax="0.15">…</section>       subtle parallax layer
 *
 * Everything is opt-in via classes; without this script content stays fully visible
 * (JS adds the hidden "pre-reveal" state), so no-JS visitors never lose content.
 */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Marker used by CSS to scope JS-dependent hiding (image clip reveal).
  // Added only when JS runs AND motion is allowed — the no-JS / reduced-motion
  // paths never hide content.
  if (!reducedMotion.matches) document.documentElement.classList.add('js-anim');

  // ── Stagger groups: assign per-child delay via --mm-delay (100–150ms) ──
  function applyStagger(group) {
    var base = parseInt(group.getAttribute('data-stagger'), 10);
    var step = (Number.isFinite(base) && base > 0 ? base : 120);
    var lastDelay = 0;
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add('reveal-item');
      lastDelay = Math.min(i * step, 600); // cap: late cards never trail far
      child.style.setProperty('--mm-delay', lastDelay + 'ms');
    });
    group._mmLastDelay = lastDelay;
  }

  // After an entrance finishes, release the animation fill so hover and
  // interaction transitions (e.g. card hover lifts) behave normally.
  var CLEANUP_BUFFER_MS = 200;
  function scheduleCleanup(el, extraDelay) {
    setTimeout(function () {
      el.classList.add('reveal-done');
    }, extraDelay + DURATION_MS + CLEANUP_BUFFER_MS);
  }
  var DURATION_MS = 700;

  // ── Pre-reveal: hide only when JS is running and motion is allowed ──────
  function armRevealTargets() {
    if (reducedMotion.matches) return;
    document.querySelectorAll('.reveal-group').forEach(applyStagger);
    var pre = document.querySelectorAll('.reveal:not(.is-visible), .reveal-group:not(.is-visible)');
    pre.forEach(function (el) { el.classList.add('pre-reveal'); });
  }

  // ── Generic reveal via IntersectionObserver ─────────────────────────────
  function createRevealObserver() {
    if (!('IntersectionObserver' in window) || reducedMotion.matches) return null;
    return new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        el.classList.remove('pre-reveal');
        if (el.classList.contains('reveal-group')) {
          scheduleCleanup(el, el._mmLastDelay || 0);
        } else {
          scheduleCleanup(el, 0);
        }
        observer.unobserve(el); // animate once, never replay
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  }

  var observer = null;
  var clipObserver = null;

  // ── Cinematic image reveal: clip wipe + gentle scale settle ────────────
  function initClipReveals() {
    var clips = document.querySelectorAll('.reveal-clip');
    if (!clips.length) return;
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      clips.forEach(function (el) { el.classList.add('reveal-shown'); });
      return;
    }
    clipObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('reveal-pending');
        entry.target.classList.add('reveal-shown');
        clipObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    clips.forEach(function (el) {
      el.classList.add('reveal-pending');
      clipObserver.observe(el);
    });
  }

  // ── Hero entrance: staggered fade/rise on page load ────────────────────
  function playHeroEntrance() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    if (reducedMotion.matches || !hero.classList.contains('hero-animate')) return;

    var seq = [
      '.hero-content h1',
      '.hero-content p',
      '.hero-actions',
      '.hero-stats'
    ];
    seq.forEach(function (selector, i) {
      var el = hero.querySelector(selector);
      if (!el) return;
      el.style.animationDelay = (0.12 + i * 0.14) + 's';
      el.classList.add('hero-in');
    });

    var bg = hero.querySelector('.hero-bg');
    if (bg) bg.classList.add('hero-bg-in');
  }

  // ── Scroll progress bar (injected; uses the site's gold accent) ────────
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('div');
    fill.className = 'scroll-progress-fill';
    bar.appendChild(fill);
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      fill.style.transform = 'scaleX(' + progress + ')';
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ── Navbar compact state on scroll (class toggle, no inline styles) ────
  function initNavbarState() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;
    var ticking = false;
    function update() {
      ticking = false;
      nav.classList.toggle('navbar-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ── Subtle parallax for marked layers (desktop / fine pointers only) ───
  function initParallax() {
    if (reducedMotion.matches) return;
    var fine = window.matchMedia('(pointer: fine)').matches;
    var small = window.matchMedia('(max-width: 768px)').matches;
    if (!fine || small) return; // skip touch & small screens for performance

    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!layers.length) return;

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return; // offscreen: skip
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      // Recompute once on resize; layers list itself is static.
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function init() {
    armRevealTargets();
    observer = createRevealObserver();
    if (observer) {
      document.querySelectorAll('.reveal, .reveal-group').forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Reduced motion or no IO support: show everything immediately.
      document.querySelectorAll('.pre-reveal').forEach(function (el) {
        el.classList.remove('pre-reveal');
      });
    }
    playHeroEntrance();
    initProgressBar();
    initNavbarState();
    initParallax();
    initClipReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose tiny hooks so late-rendered content (e.g. fleet cards) can opt in.
  window.ManuManAnimations = {
    observe: function (el) {
      if (reducedMotion.matches || !observer) return;
      el.classList.add('pre-reveal');
      observer.observe(el);
    },
    observeClip: function (el) {
      if (!el) return;
      if (reducedMotion.matches || !clipObserver) {
        el.classList.add('reveal-shown');
        return;
      }
      el.classList.add('reveal-pending');
      clipObserver.observe(el);
    },
    // Re-apply stagger classes to a group whose children were re-rendered.
    restagger: function (group) {
      if (!group || reducedMotion.matches) return;
      applyStagger(group);
      if (observer && !group.classList.contains('is-visible')) {
        group.classList.add('pre-reveal');
        observer.observe(group);
      } else if (group.classList.contains('is-visible')) {
        scheduleCleanup(group, 0);
      }
    }
  };
})();
