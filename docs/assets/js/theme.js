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
    var sidebarToggle = document.getElementById('sidebar-toggle');
    var sidebar = document.querySelector('.guide-sidebar');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        sidebarToggle.querySelector('.toggle-icon').textContent = sidebar.classList.contains('active') ? '✕' : '☰';
      });

      // Close sidebar when clicking a link
      sidebar.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          sidebar.classList.remove('active');
          sidebarToggle.querySelector('.toggle-icon').textContent = '☰';
        });
      });
    }
  });
})();
