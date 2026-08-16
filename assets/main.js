// Current year in the footer. Guarded so article pages can reuse this file.
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Scroll progress ----
// Drives the amber line sitting on the header's bottom rule. Read-only on
// scroll, coalesced into one rAF, so it never fights the scroller.
const bar = document.getElementById('scroll-bar');
if (bar) {
  let queued = false;
  const paint = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
    queued = false;
  };
  const request = () => {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request, { passive: true });
  paint();
}

// ---- Scroll reveal ----
// Progressive enhancement: the .reveal class is only added when this script
// runs, so without JS (or with reduced motion) everything stays visible.
//
// The hero is deliberately excluded. Fading in above-the-fold content delays
// the largest paint and, with a display-size headline, is the first thing a
// visitor sees stutter.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('.project, .contact-links li, .domain-inner, .mail')
    .forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

// ---- Copy the email address ----
// Progressive enhancement: the button ships hidden and is only revealed where
// the clipboard API exists, so no-JS visitors never see a dead control. The
// mailto link next to it is the path that always works.
const copyBtn = document.querySelector('.mail-copy');
if (copyBtn && navigator.clipboard) {
  copyBtn.hidden = false;
  let reset;
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(copyBtn.dataset.copy).then(() => {
      copyBtn.textContent = 'Copied';
      copyBtn.dataset.done = '';
      clearTimeout(reset);
      reset = setTimeout(() => {
        copyBtn.textContent = 'Copy';
        delete copyBtn.dataset.done;
      }, 1800);
    }).catch(() => { /* clipboard blocked; the mailto link still works */ });
  });
}
