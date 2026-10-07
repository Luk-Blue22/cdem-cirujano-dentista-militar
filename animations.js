/* CDEM - animaciones. Sin librerías. Los elementos solo se ocultan después de
   que este script marca html.anim-on; si algo falla se revierte todo. */
(function () {
  'use strict';
  var root = document.documentElement;

  // Modo captura: todo en su estado final, sin animaciones.
  try {
    if (new URLSearchParams(window.location.search).get('captura') === '1') {
      root.setAttribute('data-captura', '');
      return;
    }
  } catch (e) { return; }

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (mq && mq.matches) return;
  if (!('IntersectionObserver' in window)) return;

  var D = '#vista-escritorio';
  var M = '#vista-movil';
  var REVEAL_MS = 600;
  var HERO_MS = 750;

  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var heroEls = [];
  var scrollEls = [];
  var starGroups = [];

  function mark(sel, o) {
    o = o || {};
    all(sel).forEach(function (el, i) {
      el.setAttribute('data-reveal', '');
      if (o.stagger) el.setAttribute('data-stagger', '');
      if (o.hero) {
        el.style.setProperty('--ry', '18px');
        el.style.setProperty('--rd', HERO_MS + 'ms');
        el.style.setProperty('--d', ((o.delay || 0) + i * (o.step || 0)) + 'ms');
        heroEls.push(el);
      } else {
        scrollEls.push(el);
      }
    });
  }

  function rollback() {
    root.classList.remove('anim-on', 'anim-ready');
    all('[data-reveal],[data-stars],[data-hover],[data-btn],[data-pulse]').forEach(function (el) {
      ['data-reveal', 'data-stagger', 'data-stars', 'data-hover', 'data-btn', 'data-pulse'].forEach(function (a) { el.removeAttribute(a); });
    });
  }

  try {
    // HERO (escritorio: texto y luego foto; móvil: de arriba hacia abajo)
    mark(D + ' #inicio > div > .grid > div', { hero: true, step: 220 });
    mark(M + ' main > section:first-child > *', { hero: true, step: 90 });

    // SECCIONES AL HACER SCROLL
    // escritorio
    mark(D + ' #doctor > div');
    mark(D + ' #servicios > div > div:first-child');
    mark(D + ' #servicios > div > .grid > div', { stagger: true });
    mark(D + ' #resenas > div > div:first-child');
    mark(D + ' #resenas > div > .grid > div', { stagger: true });
    mark(D + ' #horario > div > .grid > div', { stagger: true });
    mark(D + ' footer > div');
    // móvil
    mark(M + ' main > section:nth-of-type(2) > div');
    mark(M + ' main > section:nth-of-type(3) > div:first-child');
    mark(M + ' main > section:nth-of-type(3) .grid > div', { stagger: true });
    mark(M + ' main > section:nth-of-type(4) > div:first-child');
    mark(M + ' main > section:nth-of-type(4) .space-y-3 > div', { stagger: true });
    mark(M + ' main > section:nth-of-type(5) > div');
    mark(M + ' footer > *');

    // ESTRELLAS (grupos de íconos "star")
    all('.material-symbols-outlined').forEach(function (s) {
      if (s.textContent.trim() !== 'star') return;
      var g = s.parentElement;
      if (!g || g.hasAttribute('data-stars')) return;
      g.setAttribute('data-stars', '');
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
      if (g.closest('#inicio') || g.closest(M + ' main > section:first-child')) g.style.setProperty('--sd', '450ms');
      starGroups.push(g);
    });

    // HOVER de tarjetas y foto (solo escritorio, lo limita el CSS)
    all(D + ' #servicios > div > .grid > div, ' + D + ' #resenas > div > .grid > div').forEach(function (el) {
      el.setAttribute('data-hover', '');
    });
    all(D + ' #inicio img').forEach(function (img) {
      if (img.parentElement) img.parentElement.setAttribute('data-hover', '');
    });

    // BOTONES de WhatsApp y de llamada (los enlaces tel: de texto plano se excluyen)
    all('a[href^="https://wa.me"], a[href^="tel:"]').forEach(function (a) {
      if (a.getAttribute('href').indexOf('tel:') === 0 && a.className.indexOf('rounded') === -1) return;
      a.setAttribute('data-btn', '');
    });

    // PULSO del botón de cita en móvil (el CSS lo limita a 3 ciclos)
    all(M + ' main > section:first-child > a').forEach(function (a) { a.setAttribute('data-pulse', ''); });

    root.classList.add('anim-on');   // estado oculto, sin transición
    void root.offsetHeight;          // se calcula el estilo oculto antes de activar las transiciones
    root.classList.add('anim-ready');
    void root.offsetHeight;
  } catch (err) {
    rollback();
    return;
  }

  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function (e) { if (e.matches) root.classList.remove('anim-on', 'anim-ready'); });
  }

  function show(el, delay, ms) {
    if (el.hasAttribute('data-reveal')) {
      el.style.setProperty('--d', delay + 'ms');
      el.classList.add('is-visible');
      // al terminar se devuelve el elemento a sus estilos originales (hover/transiciones de Tailwind)
      window.setTimeout(function () {
        el.removeAttribute('data-reveal');
        el.removeAttribute('data-stagger');
        el.style.removeProperty('--d');
        el.style.removeProperty('--ry');
        el.style.removeProperty('--rd');
      }, delay + (ms || REVEAL_MS) + 100);
    } else {
      el.classList.add('is-visible');
    }
  }

  var io = new IntersectionObserver(function (entries) {
    var batch = entries.filter(function (e) {
      // visible, o ya quedó por encima del viewport (carga con ancla o scroll rápido)
      return e.isIntersecting || e.boundingClientRect.bottom <= 0;
    }).sort(function (a, b) {
      return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    var k = 0;
    batch.forEach(function (e) {
      var el = e.target;
      io.unobserve(el);
      var above = !e.isIntersecting;
      var d = (!above && el.hasAttribute('data-stagger')) ? (k++) * 100 : 0;
      show(el, d, REVEAL_MS);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  // El hero se anima al cargar: dos frames para que se pinte el estado inicial.
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      heroEls.forEach(function (el) {
        var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
        show(el, d, HERO_MS);
      });
      scrollEls.forEach(function (el) { io.observe(el); });
      starGroups.forEach(function (g) { io.observe(g); });
    });
  });
})();
