(() => {
  'use strict';

  const BAYER_4X4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  const bayerHit = (col, row, intensity) => {
    const threshold = (BAYER_4X4[row & 3][col & 3] + 0.5) / 16;
    return intensity > threshold;
  };

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const masthead = document.getElementById('top');
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const navPills = document.querySelectorAll('.nav-pill');
    const sections = document.querySelectorAll('.obs-section');
    const yearEl = document.getElementById('yr');
    const backTop = document.getElementById('back-top');

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    // Masthead hairline border on scroll
    const updateHeaderState = () => {
      if (masthead) {
        masthead.classList.toggle('is-scrolled', window.scrollY > 12);
      }
    };
    window.addEventListener('scroll', updateHeaderState, { passive: true });
    updateHeaderState();

    // Mobile drawer toggle
    if (menuToggle && mobileDrawer) {
      menuToggle.addEventListener('click', () => {
        const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', String(!isOpen));
        mobileDrawer.hidden = isOpen;
      });

      mobileDrawer.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          menuToggle.setAttribute('aria-expanded', 'false');
          mobileDrawer.hidden = true;
        });
      });
    }

    // One-time scroll reveal
    const revealEls = document.querySelectorAll('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else if (revealEls.length) {
      const revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      revealEls.forEach((el) => revealObserver.observe(el));
    }

    // Scrollspy
    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navPills.forEach((item) => {
              item.classList.toggle('active', item.getAttribute('href') === `#${id}`);
            });
          });
        },
        { rootMargin: '-28% 0px -56% 0px', threshold: 0 }
      );
      sections.forEach((sec) => observer.observe(sec));
    }

    // Back to top
    if (backTop) {
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Smooth BibTeX panel toggle
    document.querySelectorAll('.bibtex-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');
        const panel = targetId ? document.getElementById(targetId) : null;
        if (!panel) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !expanded;
        btn.setAttribute('aria-expanded', String(nextExpanded));
        panel.setAttribute('aria-hidden', String(!nextExpanded));
        panel.classList.toggle('is-open', nextExpanded);
      });
    });

    // Clipboard copy buttons
    const copyText = async (text) => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    };

    document.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.dataset.copyTarget;
        const rawText = targetId
          ? (document.getElementById(targetId)?.textContent || '')
          : (btn.dataset.copyText || '');
        if (!rawText) return;
        const original = btn.textContent;
        try {
          await copyText(rawText.trim());
          btn.textContent = 'Copied';
          setTimeout(() => {
            btn.textContent = original;
          }, 1600);
        } catch (e) {
          btn.textContent = 'Failed';
          setTimeout(() => {
            btn.textContent = original;
          }, 1600);
        }
      });
    });

    // Monochrome 4x4 Bayer dithered horizon at top edge of the charcoal footer
    const drawFooterMosaic = () => {
      const canvas = document.getElementById('footer-mosaic');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const tile = 4;
      const cols = Math.ceil(rect.width / tile);
      const rows = Math.ceil(rect.height / tile);
      canvas.width = cols;
      canvas.height = rows;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cols, rows);
      ctx.fillStyle = '#2a2926';

      for (let r = 0; r < rows; r += 1) {
        const ny = r / rows;
        for (let c = 0; c < cols; c += 1) {
          const nx = c / cols;
          const wave = 0.5 + 0.5 * Math.sin(nx * 6.0 + Math.cos(ny * 3.0));
          const fade = Math.max(0, 1 - ny * 1.15);
          if (bayerHit(c, r, wave * fade * 0.85)) {
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
    };

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawFooterMosaic, 140);
    });

    // Theme toggle
    const syncThemeUi = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (themeLabel) {
        themeLabel.textContent = isDark ? 'Ivory' : 'Slate';
      }
      if (themeToggle) {
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to Ivory light theme' : 'Switch to Slate dark theme');
      }
    };

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = root.getAttribute('data-theme') === 'dark';
        if (isDark) {
          root.removeAttribute('data-theme');
          try { localStorage.setItem('homepage-theme', 'light'); } catch (e) {}
        } else {
          root.setAttribute('data-theme', 'dark');
          try { localStorage.setItem('homepage-theme', 'dark'); } catch (e) {}
        }
        syncThemeUi();
      });
    }

    syncThemeUi();
    drawFooterMosaic();
  });
})();
