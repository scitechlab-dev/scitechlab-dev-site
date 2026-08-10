// Current year in the footer. Guarded so article pages can reuse this file.
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
