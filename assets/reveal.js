/* Shared interaction layer for Gleric Studio demo sites
   - scroll reveal via IntersectionObserver ([data-reveal])
   - staggered children ([data-reveal-group] > *)
   - sticky header state toggle ([data-header])
   - count-up stats ([data-count])
   - mobile nav toggle ([data-nav-toggle] / [data-nav])
   - simple form fake-submit ([data-fakeform])
*/
(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    // ---- Scroll reveal ----
    var reveals = document.querySelectorAll('[data-reveal]');
    var groups = document.querySelectorAll('[data-reveal-group]');

    groups.forEach(function (g) {
      var kids = Array.from(g.children);
      kids.forEach(function (k, i) {
        k.setAttribute('data-reveal', '');
        k.style.transitionDelay = (i * (parseInt(g.getAttribute('data-stagger')) || 80)) + 'ms';
      });
    });

    var allReveals = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      allReveals.forEach(function (el) { io.observe(el); });
    } else {
      allReveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    // ---- Sticky header state ----
    var header = document.querySelector('[data-header]');
    if (header) {
      var setH = function () {
        if (window.scrollY > 24) header.classList.add('is-scrolled');
        else header.classList.remove('is-scrolled');
      };
      setH();
      window.addEventListener('scroll', setH, { passive: true });
    }

    // ---- Count-up ----
    var counts = document.querySelectorAll('[data-count]');
    if (counts.length && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          cio.unobserve(el);
          var target = parseFloat(el.getAttribute('data-count'));
          var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
          var dur = 1400, start = performance.now();
          var pre = el.getAttribute('data-prefix') || '';
          var suf = el.getAttribute('data-suffix') || '';
          function tick(now) {
            var p = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            var val = (target * eased).toFixed(dec);
            el.textContent = pre + Number(val).toLocaleString('en-US') + suf;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = pre + Number(target.toFixed(dec)).toLocaleString('en-US') + suf;
          }
          requestAnimationFrame(tick);
        });
      }, { threshold: 0.5 });
      counts.forEach(function (c) { cio.observe(c); });
    }

    // ---- Mobile nav ----
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });
    }

    // ---- Fake form submit ----
    document.querySelectorAll('[data-fakeform]').forEach(function (form) {
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var note = form.querySelector('[data-form-note]');
        var btn = form.querySelector('button[type="submit"], button:not([type])');
        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Verzonden ✓'; }
        if (note) note.classList.add('is-visible');
        setTimeout(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
          form.reset();
        }, 2600);
      });
    });

    // ---- Smooth anchor scroll ----
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (t) { ev.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' }); }
      });
    });
  });
})();
