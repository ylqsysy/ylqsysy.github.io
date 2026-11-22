(() => {
  'use strict';

  // 4x4 Ordered Bayer threshold matrix (normalized 0..15)
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
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.obs-section');
    const yearEl = document.getElementById('yr');
    const backTop = document.getElementById('back-top');

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

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

    // One-time scroll reveal observer
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

    // Navigation scrollspy
    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navItems.forEach((item) => {
              item.classList.toggle('active', item.getAttribute('href') === `#${id}`);
            });
          });
        },
        { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
      );
      sections.forEach((sec) => observer.observe(sec));
    }

    // Subtle 3D pointer tilt on portrait plate
    const portraitStage = document.getElementById('portrait-stage');
    const portraitPlate = document.getElementById('portrait-plate');
    if (portraitStage && portraitPlate && finePointer && !reducedMotion) {
      portraitStage.addEventListener('mousemove', (event) => {
        const rect = portraitStage.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        portraitPlate.style.setProperty('--rx', `${(-ny * 5.5).toFixed(2)}deg`);
        portraitPlate.style.setProperty('--ry', `${(nx * 5.5).toFixed(2)}deg`);
        portraitPlate.style.setProperty('--mx', `${((nx + 0.5) * 100).toFixed(1)}%`);
        portraitPlate.style.setProperty('--my', `${((ny + 0.5) * 100).toFixed(1)}%`);
      });

      portraitStage.addEventListener('mouseleave', () => {
        portraitPlate.style.setProperty('--rx', '0deg');
        portraitPlate.style.setProperty('--ry', '0deg');
      });
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

    // Static Low-Fi Bayer Dithered Mosaic Generators
    const getThemeColors = () => {
      const s = getComputedStyle(root);
      const isDark = root.getAttribute('data-theme') === 'dark';
      return {
        isDark,
        bg: s.getPropertyValue('--bg').trim(),
        surface: s.getPropertyValue('--surface').trim(),
        border: s.getPropertyValue('--border').trim(),
        borderStrong: s.getPropertyValue('--border-strong').trim(),
        ink: s.getPropertyValue('--ink').trim(),
        terracotta: s.getPropertyValue('--terracotta').trim(),
        blue: s.getPropertyValue('--blue').trim(),
        sage: s.getPropertyValue('--sage').trim()
      };
    };

    const drawHeroMosaic = () => {
      const canvas = document.getElementById('hero-mosaic');
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

      const colors = getThemeColors();
      const baseHex = colors.isDark ? '#252421' : '#e3dacc';
      const accentHex = colors.terracotta;

      for (let r = 0; r < rows; r += 1) {
        const ny = r / rows;
        for (let c = 0; c < cols; c += 1) {
          const nx = c / cols;
          // Gentle diagonal orbital sweep + contour bands
          const wave = 0.5 + 0.5 * Math.sin(nx * 6.5 - ny * 4.2 + Math.cos(nx * 2.4) * 1.1);
          const fade = Math.max(0, 1 - ny * 1.15);
          const density = wave * fade * 0.72;

          if (bayerHit(c, r, density)) {
            const isTerracottaAccent = wave > 0.88 && nx > 0.55 && ny < 0.55 && ((c + r) % 3 === 0);
            ctx.fillStyle = isTerracottaAccent ? accentHex : baseHex;
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
    };

    const drawCardMosaic = (canvas) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const tile = 3;
      const cols = Math.ceil(rect.width / tile);
      const rows = Math.ceil(rect.height / tile);
      canvas.width = cols;
      canvas.height = rows;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const colors = getThemeColors();
      const motif = canvas.dataset.motif || 'hyperspectral';

      ctx.fillStyle = colors.surface;
      ctx.fillRect(0, 0, cols, rows);

      for (let r = 0; r < rows; r += 1) {
        const ny = r / rows;
        for (let c = 0; c < cols; c += 1) {
          const nx = c / cols;

          if (motif === 'hyperspectral') {
            // Layered spectral diamond/prism with center target
            const dx = Math.abs(nx - 0.5) * 1.5;
            const dy = Math.abs(ny - 0.52) * 1.25;
            const dist = dx + dy;
            const field = Math.max(0, 1 - dist * 1.15);
            if (dist < 0.14) {
              ctx.fillStyle = colors.terracotta;
              ctx.fillRect(c, r, 1, 1);
            } else if (bayerHit(c, r, field * 0.92)) {
              ctx.fillStyle = dist < 0.34 ? colors.terracotta : colors.ink;
              ctx.fillRect(c, r, 1, 1);
            }
          } else if (motif === 'terrain') {
            // Multi-source orbital swath & topographic dithered contours
            const contour = Math.sin(nx * 8.2 + Math.sin(ny * 4.5) * 1.6);
            const band = 0.5 + 0.5 * contour;
            const swath = Math.abs(nx - 0.58 + (ny - 0.5) * 0.35) < 0.22 ? 0.25 : 0;
            if (bayerHit(c, r, Math.min(0.95, band * 0.65 + swath))) {
              ctx.fillStyle = swath > 0 && band > 0.65 ? colors.ink : colors.sage;
              ctx.fillRect(c, r, 1, 1);
            }
          } else {
            // Spatiotemporal scanline + wave interference matrix
            const scanline = (r % 2 === 0) ? 0.18 : 0;
            const interference = 0.5 + 0.5 * Math.cos(nx * 10.0 - ny * 3.0) * Math.sin(ny * 6.0 + nx * 2.0);
            const intensity = Math.min(0.95, interference * 0.68 + scanline);
            if (bayerHit(c, r, intensity)) {
              ctx.fillStyle = interference > 0.78 ? colors.ink : colors.blue;
              ctx.fillRect(c, r, 1, 1);
            }
          }
        }
      }
    };

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

      const colors = getThemeColors();
      for (let r = 0; r < rows; r += 1) {
        const ny = r / rows;
        for (let c = 0; c < cols; c += 1) {
          const nx = c / cols;
          const radial = 0.5 + 0.5 * Math.sin(nx * 7.5 + ny * 3.0);
          const fade = Math.max(0, 1 - ny * 1.45);
          if (bayerHit(c, r, radial * fade * 0.55)) {
            ctx.fillStyle = (nx > 0.72 && (c + r) % 4 === 0) ? colors.terracotta : '#2d2c28';
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
    };

    const plateCanvases = document.querySelectorAll('.mosaic-plate-canvas');
    const renderAllMosaics = () => {
      drawHeroMosaic();
      plateCanvases.forEach(drawCardMosaic);
      drawFooterMosaic();
    };

    // Subtle scroll parallax for research mosaic plates
    if (!reducedMotion && plateCanvases.length) {
      let scrollTicking = false;
      const updateMosaicParallax = () => {
        const vh = window.innerHeight || 800;
        plateCanvases.forEach((canvas) => {
          const rect = canvas.parentElement.getBoundingClientRect();
          const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
          const offset = Math.max(-7, Math.min(7, progress * -9));
          canvas.style.setProperty('--py', `${offset.toFixed(1)}px`);
        });
        scrollTicking = false;
      };

      window.addEventListener(
        'scroll',
        () => {
          if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(updateMosaicParallax);
          }
        },
        { passive: true }
      );
      updateMosaicParallax();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderAllMosaics, 120);
    });

    // Theme toggle sync
    const syncThemeUi = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (themeLabel) {
        themeLabel.textContent = isDark ? 'Parchment' : 'Charcoal';
      }
      if (themeToggle) {
        themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
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
        renderAllMosaics();
      });
    }

    syncThemeUi();
    renderAllMosaics();
  });
})();
