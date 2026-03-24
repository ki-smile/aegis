/* AEGIS Theme Toggle — IIFE runs before DOMContentLoaded to prevent flash */
(function () {
  var stored = localStorage.getItem('aegis-theme');
  var preferred = stored || 'dark';
  document.documentElement.setAttribute('data-theme', preferred);

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');

    function updateLabel() {
      if (!toggle) return;
      var current = document.documentElement.getAttribute('data-theme');
      toggle.textContent = current === 'dark' ? '☀ Light' : '☾ Dark';
      toggle.setAttribute('aria-label', current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }

    updateLabel();

    if (toggle) {
      toggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('aegis-theme', next);
        updateLabel();
      });
    }

    // Mobile Menu Toggle
    var menuBtn = document.getElementById('menu-toggle');
    var navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        menuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
      });

      // Close menu when clicking a link
      navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          navLinks.classList.remove('active');
          menuBtn.textContent = '☰';
        });
      });
    }

    // Sidebar Toggle (for Guide)
    var fabToggle = document.getElementById('fab-toggle');
    var sidebar = document.querySelector('.guide-sidebar');
    var overlay = document.getElementById('sidebar-overlay');

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      if (fabToggle) {
        fabToggle.textContent = '☰';
      }
    }

    if (fabToggle && sidebar) {
      fabToggle.addEventListener('click', function() {
        var isOpen = sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        fabToggle.textContent = isOpen ? '✕' : '☰';
      });

      if (overlay) {
        overlay.addEventListener('click', closeSidebar);
      }

      // Close sidebar when clicking a link
      sidebar.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', closeSidebar);
      });
    }
  });
})();
