/* AEGIS Theme Toggle — IIFE runs before DOMContentLoaded to prevent flash */
(function () {
  var stored = localStorage.getItem('aegis-theme');
  var preferred = stored || 'dark';
  document.documentElement.setAttribute('data-theme', preferred);

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    function updateLabel() {
      var current = document.documentElement.getAttribute('data-theme');
      toggle.textContent = current === 'dark' ? '☀ Light' : '☾ Dark';
      toggle.setAttribute('aria-label', current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    updateLabel();

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('aegis-theme', next);
      updateLabel();
    });
  });
})();
