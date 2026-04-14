(() => {
  'use strict';

  /* ── Page load sequence ── */
  window.addEventListener('load', () => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('is-loading');
    });
  });

  document.addEventListener('DOMContentLoaded', () => {

    const root    = document.documentElement;
    const toggle  = document.getElementById('themeToggle');
    const secs    = document.querySelectorAll('.sec');
    const navs    = document.querySelectorAll('.nav-link');
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    /* ═══════════════════════════════════════════
       Theme
       ═══════════════════════════════════════════ */
    if (localStorage.getItem('theme') === 'dark') root.setAttribute('data-theme', 'dark');

    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    /* ═══════════════════════════════════════════
       Scroll progress bar
       ═══════════════════════════════════════════ */
    const progressBar = document.getElementById('scrollProgress');
    let ticking = false;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.transform = `scaleX(${progress})`;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    /* ═══════════════════════════════════════════
       Cursor glow (desktop only)
       ═══════════════════════════════════════════ */
    const glow = document.getElementById('cursorGlow');
    const isTouch = matchMedia('(hover:none)').matches;

    if (!isTouch && glow) {
      let glowX = 0, glowY = 0, curX = 0, curY = 0;

      document.addEventListener('mousemove', e => {
        curX = e.clientX;
        curY = e.clientY;
        if (!glow.classList.contains('active')) glow.classList.add('active');
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        glow.classList.remove('active');
      });

      /* smooth lerp follow — faster factor for responsiveness */
      function lerpGlow() {
        glowX += (curX - glowX) * 0.12;
        glowY += (curY - glowY) * 0.12;
        glow.style.transform = `translate3d(${glowX - 200}px,${glowY - 200}px,0)`;
        requestAnimationFrame(lerpGlow);
      }
      lerpGlow();
    }

    /* ═══════════════════════════════════════════
       Active nav on scroll
       ═══════════════════════════════════════════ */
    const navObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navs.forEach(n => n.classList.toggle('active', n.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-25% 0px -55% 0px' });
    secs.forEach(s => navObs.observe(s));

    /* ═══════════════════════════════════════════
       Section reveal (staggered)
       ═══════════════════════════════════════════ */
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          reveal.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    secs.forEach(s => reveal.observe(s));

    /* ═══════════════════════════════════════════
       Magnetic contact cards (desktop)
       ═══════════════════════════════════════════ */
    if (!isTouch) {
      document.querySelectorAll('.contact-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          const rotateX = -(y / rect.height) * 8;
          const rotateY = (x / rect.width) * 8;
          card.style.transform =
            `translate3d(0,-4px,0) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
        });
      });
    }

    /* ═══════════════════════════════════════════
       Mobile menu (body scroll lock)
       ═══════════════════════════════════════════ */
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

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) closeMenu();
    });

    /* ═══════════════════════════════════════════
       Year
       ═══════════════════════════════════════════ */
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
  });
})();
