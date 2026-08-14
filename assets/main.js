// Current year in the footer. Guarded so article pages can reuse this file.
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  document.querySelectorAll('.project, .contact-links li, .domain-inner')
    .forEach(el => { el.classList.add('reveal'); io.observe(el); });
}
