(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {

    const root    = document.documentElement;
    const toggle  = document.getElementById('themeToggle');
    const secs    = document.querySelectorAll('.sec');
    const navs    = document.querySelectorAll('.nav-link');
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    /* ── Theme ── */
    if (localStorage.getItem('theme') === 'dark') root.setAttribute('data-theme', 'dark');

    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    /* ── Active nav on scroll ── */
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navs.forEach(n => n.classList.toggle('active', n.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-25% 0px -55% 0px' });
    secs.forEach(s => navObs.observe(s));

    /* ── Section reveal ── */
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); reveal.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    secs.forEach(s => reveal.observe(s));

    /* ── Mobile menu (with body scroll lock) ── */
    let scrollY = 0;

    function openMenu() {
      scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('menu-open');
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }

    function closeMenu() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    }

    menuBtn.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay.addEventListener('click', closeMenu);
    navs.forEach(n => n.addEventListener('click', closeMenu));

    /* close menu on Escape key */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeMenu();
    });

    /* ── Year ── */
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
  });
})();
