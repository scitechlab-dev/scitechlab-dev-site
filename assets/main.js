// Current year in the footer. Guarded so article pages can reuse this file.
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Work tabs ----
// Panels ship unhidden, so without JS every domain is still readable as one
// long list. This only takes over once the script runs.
const tablist = document.querySelector('[role="tablist"]');

if (tablist) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panelOf = tab => document.getElementById(tab.getAttribute('aria-controls'));

  function select(tab, focus = true) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panelOf(t).hidden = !on;
    });
    if (focus) tab.focus();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => select(tab, false));
  });

  // Left/right arrows move between tabs, Home/End jump to the ends.
  tablist.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    else return;
    e.preventDefault();
    select(next);
  });

  select(tabs[0], false);
}

// ---- Scroll reveal ----
// Progressive enhancement: the .reveal class is only added when this script
// runs, so without JS (or with reduced motion) everything stays visible.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('.project, .contact-links li, .now-item, .hero-text > *')
    .forEach(el => { el.classList.add('reveal'); io.observe(el); });
}
