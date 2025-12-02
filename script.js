/* filepath: /Users/oscar/Desktop/Floeurs/Site/le-temps-des-fleurs-site-final copie/script.js */
(function() {
  let lastY = window.scrollY || 0;
  const header = document.querySelector('header');
  const footer = document.querySelector('.footer');
  const heroImage = document.querySelector('.hero-image');
  const threshold = 10; // éviter les micro scrolls
  let ticking = false;

  function headerHeight() {
    return header ? header.getBoundingClientRect().height : 0;
  }

  function atPageBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  }

  // Sur la page d'accueil: ne masquer le header qu'après la fin de l'image (.hero-image)
  // Sur les autres pages: appliquer un petit seuil (ex: 150px) avant autoriser le masquage
  function canHideHeaderNow() {
    if (heroImage) {
      const bottom = heroImage.getBoundingClientRect().bottom;
      return bottom <= headerHeight();
    }
    return window.scrollY > 150; // seuil générique sans image
  }

  function onScroll() {
    const currentY = window.scrollY || 0;
    const diff = currentY - lastY;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // scroll down -> hide header (si autorisé) & footer (sauf bas de page)
        if (header) {
          if (canHideHeaderNow()) header.classList.add('header--hidden');
          else header.classList.remove('header--hidden');
        }
        if (footer && !atPageBottom()) footer.classList.add('footer--hidden');
      } else {
        // scroll up -> show header & footer
        if (header) header.classList.remove('header--hidden');
        if (footer) footer.classList.remove('footer--hidden');
      }
      lastY = currentY;
    }

    // Toujours montrer le footer à la fin de page
    if (footer && atPageBottom()) {
      footer.classList.remove('footer--hidden');
    }

    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
})();
// Ensure header/footer are visible when arriving via an intercepted navigation
// (prevents a page-load where the header appears retracted because the
// source page had it hidden). We only force it briefly on initial load when
// a transition class is present so normal scroll-based hiding still works.
document.addEventListener('DOMContentLoaded', function () {
  try {
    var doc = document.documentElement;
    var hdr = document.querySelector('header');
    var ftr = document.querySelector('.footer');
    if (!doc || (!hdr && !ftr)) return;
    if (doc.classList.contains('transition-forward') || doc.classList.contains('transition-back')) {
      hdr && hdr.classList.remove('header--hidden');
      ftr && ftr.classList.remove('footer--hidden');
      // Also ensure any inline transition scripts that added transition-* classes
      // don't immediately re-hide the header: remove header--hidden after a short delay
      // so the page's scroll scripts can take over naturally.
      setTimeout(function() {
        hdr && hdr.classList.remove('header--hidden');
        ftr && ftr.classList.remove('footer--hidden');
      }, 40);
    }
  } catch (e) {
    // no-op on error
  }
});

// Remove temporary transition classes after the expected animation duration so
// the header/footer are free to behave (hover, show/hide) normally.
// This guards against a transition class lingering (for example when the
// incoming page added 'transition-forward' from sessionStorage) which would
// otherwise freeze header interactions via CSS overrides.
document.addEventListener('DOMContentLoaded', function () {
  try {
    var doc = document.documentElement;
    if (!doc) return;
    var HAS_TRANS = doc.classList.contains('transition-forward') || doc.classList.contains('transition-back') || doc.classList.contains('transition-forward-leave') || doc.classList.contains('transition-back-leave');
    if (!HAS_TRANS) return;
    // Duration slightly longer than the CSS animation (520ms) to be safe.
    var cleanupAfter = 640;
    setTimeout(function() {
      // remove any of the transition classes we use
      doc.classList.remove('transition-forward', 'transition-back', 'transition-forward-leave', 'transition-back-leave');
    }, cleanupAfter);
  } catch (e) {
    // ignore
  }
});

// Préserver la position de scroll quand le verrouillage (<=900px) s'active/désactive
(function() {
  const mql = window.matchMedia('(max-width: 900px)');
  let savedY = window.scrollY;
  let savedX = window.scrollX;
  let savedRatio = 0; // proportion de scroll dans la page
  let anchorEl = null; // élément visible au centre de l'écran à préserver
  let transitioning = false; // empêche l'écrasement des valeurs pendant le basculement
  let lastWidth = window.innerWidth;

  function save() {
    if (transitioning) return; // ne pas écraser pendant la transition de verrouillage
    savedY = window.scrollY;
    savedX = window.scrollX;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    savedRatio = Math.min(1, Math.max(0, savedY / maxScroll));
  }

  function isWithin(el, root) {
    if (!el) return false;
    let n = el;
    while (n) {
      if (n === root) return true;
      n = n.parentElement;
    }
    return false;
  }

  function updateAnchor() {
    const x = Math.floor(window.innerWidth / 2);
    const y = Math.floor(window.innerHeight / 2);
    const candidate = document.elementFromPoint(x, y);
    const header = document.querySelector('header');
    const footer = document.querySelector('.footer');
    if (!candidate) return;
    // Ignorer les éléments du header/footer ou sans offsetParent (non visibles)
    if (isWithin(candidate, header) || isWithin(candidate, footer)) return;
    if (candidate.offsetParent) anchorEl = candidate;
  }

  // Sauvegarder la position pendant les interactions normales
  window.addEventListener('scroll', save, { passive: true });
  // Ne pas sauvegarder pendant resize pour éviter d'écraser avec 0 pendant un reflow
  // Mettre à jour périodiquement l'ancre visuelle
  window.addEventListener('scroll', () => { if (!transitioning) requestAnimationFrame(updateAnchor); }, { passive: true });
  window.addEventListener('resize', () => { if (!transitioning) requestAnimationFrame(updateAnchor); }, { passive: true });

  function restore(snapshot) {
    const x = snapshot ? snapshot.savedX : savedX;
    // Calculer une cible cohérente en fonction de la nouvelle hauteur de page
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const baseRatio = snapshot ? snapshot.savedRatio : savedRatio;
    let targetY = Math.round(baseRatio * maxScroll);
    // Si ratio inutilisable, fallback sur savedY borné
    const baseY = snapshot ? snapshot.savedY : savedY;
    if (!isFinite(targetY) || targetY <= 0) {
      targetY = Math.min(baseY, maxScroll);
    }
    // Désactiver temporairement le scroll lisse pour un repositionnement instantané
    const html = document.documentElement;
    const prevBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    // Restaurer après le reflow induit par le media query
    requestAnimationFrame(() => {
      window.scrollTo(x, targetY);
      // Deuxième frame pour couvrir les recalculs tardifs (Safari)
      requestAnimationFrame(() => {
        window.scrollTo(x, targetY);
        // Petit délai de sûreté
        setTimeout(() => {
          window.scrollTo(x, targetY);
          // Si on a une ancre visuelle valide, recaler pour garder le même élément au centre
          if (snapshot && snapshot.anchor && snapshot.anchor.isConnected) {
            const el = snapshot.anchor;
            const rect = el.getBoundingClientRect();
            if (rect && isFinite(rect.top)) {
              const desiredCenterY = window.innerHeight / 2;
              const delta = rect.top + rect.height / 2 - desiredCenterY;
              let finalY = Math.max(0, Math.min(maxScroll, window.scrollY + delta));
              window.scrollTo(window.scrollX, finalY);
            }
          }
          html.style.scrollBehavior = prevBehavior || '';
          transitioning = false; // fin de transition
        }, 30);
      });
    });
  }

  // Déclenché quand on passe au-dessus/en-dessous de 900px
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', () => {
      // Snapshoter les valeurs immédiatement pour ne pas être écrasé par un scroll 0
      const snapshot = { savedX, savedY, savedRatio, anchor: anchorEl };
      transitioning = true;
      restore(snapshot);
    });
  } else if (typeof mql.addListener === 'function') {
    // Compatibilité Safari plus ancien
    mql.addListener(() => {
      const snapshot = { savedX, savedY, savedRatio, anchor: anchorEl };
      transitioning = true;
      restore(snapshot);
    });
  }

  // Filet de sécurité: détecter le franchissement du seuil 900px via resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    const now = window.innerWidth;
    const crossed = (lastWidth > 900 && now <= 900) || (lastWidth <= 900 && now > 900);
    lastWidth = now;
    if (!crossed || transitioning) return;
    const snapshot = { savedX, savedY, savedRatio, anchor: anchorEl };
    transitioning = true;
    // Debounce très court pour laisser le reflow s'effectuer
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      restore(snapshot);
      // Relance une restauration après un court délai pour couvrir un second reflow
      setTimeout(() => restore(snapshot), 80);
    }, 10);
  }, { passive: true });
})();

// Cross-document sliding transitions between key pages (progressive enhancement)
(function() {
  // Apply incoming transition class as early as possible when this script is loaded
  // (some pages include a head-inline copy of this snippet, but not all). This
  // ensures the fallback enter animation runs even on pages that don't have a
  // .page-shell wrapper or an inline head script.
  try {
    var _dir = null;
    try { _dir = sessionStorage.getItem('vt-dir'); } catch (e) { _dir = null; }
    if (_dir) {
      document.documentElement.classList.add('transition-' + _dir);
      try { sessionStorage.removeItem('vt-dir'); } catch (e) {}
    }
  } catch (e) { /* ignore */ }

  const supportsVT = typeof document.startViewTransition === 'function';
  // Order of pages for determining forward/back transition direction.
  // Extended to include the three home menu targets so clicking the big cards triggers the same VT animation.
  const order = [
    'index.html',
    'a-cueillir-chez-nous.html',
    'nos-distributeurs.html',
    'notre-histoire.html',
    'notre-mission.html',
  'ontenteuntrucensemble.html'
  ];

  function filenameFrom(urlLike) {
    try {
      const url = new URL(urlLike, window.location.href);
      const last = url.pathname.split('/').pop() || '';
      return decodeURIComponent(last || 'index.html');
    } catch (e) {
      return 'index.html';
    }
  }

  function directionTo(targetFile, linkEl) {
    // Prefer explicit data-order when available on the current document and
    // on the clicked anchor (see wiring below which seeds anchors with a
    // DOM-only data-order when the file appears in the `order` array).
    try {
      const currentFile = filenameFrom(window.location.href);
      const currentAttr = document.documentElement.getAttribute('data-order');
      const currentIdx = (currentAttr != null && currentAttr !== '') ? parseInt(currentAttr, 10) : order.indexOf(currentFile);
      var targetIdx = -1;
      // Prefer a data-order set on the clicked anchor if present (seeding
      // happens during wiring). Otherwise fall back to the order[] lookup.
      try {
        if (linkEl) {
          var linkOrder = linkEl.getAttribute('data-order');
          if (linkOrder != null && linkOrder !== '') targetIdx = parseInt(linkOrder, 10);
        }
      } catch (e) { targetIdx = -1; }
      if (!isFinite(targetIdx) || targetIdx < 0) targetIdx = order.indexOf(targetFile);
      if (isFinite(currentIdx) && currentIdx >= 0 && targetIdx >= 0 && currentIdx !== targetIdx) {
        return targetIdx > currentIdx ? 'forward' : 'back';
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function getOrderIndexForFilename(file) {
    try {
      return order.indexOf(file);
    } catch (e) { return -1; }
  }

  function setOutgoingClass(dir) {
    if (!dir) return;
    document.documentElement.classList.remove('transition-forward', 'transition-back');
    document.documentElement.classList.add('transition-' + dir);
  }

  function navigateWithVT(href, dir) {
    try { sessionStorage.setItem('vt-dir', dir || 'forward'); } catch (e) {}
    setOutgoingClass(dir);
    if (supportsVT) {
      document.startViewTransition(() => {
        window.location.href = href;
      });
    } else {
      // Fallback: play a short leave animation then navigate
      const cls = 'transition-' + (dir || 'forward') + '-leave';
      document.documentElement.classList.add(cls);
      setTimeout(() => { window.location.href = href; }, 520);
    }
  }

  function isSameDocumentAnchor(href) {
    if (!href) return false;
    try {
      var u = new URL(href, window.location.href);
      return u.pathname === window.location.pathname && (u.hash || '') !== '';
    } catch (e) { return false; }
  }

  function isInternalLink(a) {
    if (!a || !a.getAttribute) return false;
    const href = a.getAttribute('href');
    if (!href) return false;
    // Ignore javascript:, mailto:, tel:, data:, and anchors-only
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return false;
    if (href.trim().charAt(0) === '#') return false;
    // target _blank should be left alone
    if (a.target && a.target.toLowerCase() === '_blank') return false;
    // If it's a same-document anchor (path equal + hash), let browser handle scroll
    if (isSameDocumentAnchor(href)) return false;
    // Only intercept same-origin navigations
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
    } catch (e) {
      return false;
    }
    return true;
  }

  function onClick(e) {
    const a = e.currentTarget;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // allow modifiers
    if (!isInternalLink(a)) return; // let external/anchor links behave normally
    const targetFile = filenameFrom(a.getAttribute('href'));
    // Attempt to determine direction using the page order. If the anchor
    // was seeding a data-order value during wiring, that will be used via
    // the directionTo logic which prefers explicit data-order when present.
    const dir = directionTo(targetFile, a);
    // If direction unknown, default to forward so we still show a transition
    const useDir = dir || 'forward';
    e.preventDefault();
    navigateWithVT(a.href, useDir);
  }

  function wire() {
    // Intercept a broad set of internal links site-wide while keeping
    // default behavior for external links, anchors and modifier-clicks.
    const all = Array.from(document.querySelectorAll('a[href]'));
    all.forEach(a => {
      try {
        if (!isInternalLink(a)) return;
        // If we know this target's index from the `order[]` array, seed a
        // data-order attribute on the anchor (DOM-only). This lets
        // directionTo prefer explicit indices without having to edit every
        // HTML file's markup. It also helps future clicks be deterministic.
        try {
          const file = filenameFrom(a.href || a.getAttribute('href'));
          const idx = getOrderIndexForFilename(file);
          if (idx >= 0) a.setAttribute('data-order', String(idx));
        } catch (e) { /* ignore seeding errors */ }
        // Attach handler only once
        a.addEventListener('click', onClick);
      } catch (e) { /* ignore individual link errors */ }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

// Ensure header/footer are visible on small screens after load (defensive)
document.addEventListener('DOMContentLoaded', function () {
  try {
    if (window.innerWidth <= 480) {
      var h = document.querySelector('header');
      var f = document.querySelector('.footer');
      if (h && h.classList.contains('header--hidden')) h.classList.remove('header--hidden');
      if (f && f.classList.contains('footer--hidden')) f.classList.remove('footer--hidden');
    }
  } catch (e) { /* ignore */ }
});
