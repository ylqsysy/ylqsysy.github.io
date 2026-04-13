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

    /* ── Mobile menu ── */
    function close() { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    menuBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); });
    overlay.addEventListener('click', close);
    navs.forEach(n => n.addEventListener('click', close));

    /* ── Year ── */
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
  });
})();
