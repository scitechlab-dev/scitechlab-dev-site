// ---- year ----
document.getElementById('year').textContent = new Date().getFullYear();

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- count-up telemetry numbers ----
function animateCount(el) {
  const raw = el.dataset.count;
  const target = parseFloat(raw);
  const decimals = (raw.split('.')[1] || '').length;
  const suffix = el.dataset.suffix || '';
  if (reduce) { el.textContent = target.toFixed(decimals) + suffix; return; }
  const dur = 1100;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const numObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
  });
}, { threshold: 0.6 });
document.querySelectorAll('.num').forEach(n => numObserver.observe(n));

// ---- scroll reveal for cards & sections ----
const revealTargets = document.querySelectorAll('.card, .section-head, .about-body, .about-head, .interests, .pubs, .contact-inner');
revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 3) * 70 + 'ms';
});
const revObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.15 });
revealTargets.forEach(el => revObserver.observe(el));
