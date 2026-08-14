// Current year in the footer. Guarded so article pages can reuse this file.
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Scroll reveal ----
// Progressive enhancement: .reveal is only added when this script runs, so
// without JS (or with reduced motion) everything stays visible.
//
// Deliberately never applied to the hero. Animating above-the-fold content on
// load delays the largest paint and reads as a template; these rows are all
// below the fold, so the effect only fires on an actual scroll.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12 });

  document.querySelectorAll('.work-item, .idx-row')
    .forEach(el => { el.classList.add('reveal'); io.observe(el); });
}
