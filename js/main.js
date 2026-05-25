(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.sec');

    /* ═══════════════════════════════════════════
       Scrollspy for Navigation
       ═══════════════════════════════════════════ */
    const observerOptions = {
      root: null,
      // Trigger when the section crosses the middle of the viewport
      rootMargin: '-40% 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Remove active from all
          navLinks.forEach(link => link.classList.remove('active'));
          
          // Add active to current
          const activeLink = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    }, observerOptions);

    sections.forEach(sec => observer.observe(sec));

    /* ═══════════════════════════════════════════
       Footer Year
       ═══════════════════════════════════════════ */
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
  });
})();
