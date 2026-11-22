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

    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const draftingArcs = document.getElementById('page-drafting-arcs');
    const yearEl = document.getElementById('yr');
    const backTop = document.getElementById('back-top');

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    // Gentle parallax for whisper-light outer drafting arcs
    let scrollTicking = false;
    const updateScrollState = () => {
      if (draftingArcs && !reducedMotion) {
        draftingArcs.style.transform = `translate3d(0, ${(-window.scrollY * 0.03).toFixed(1)}px, 0)`;
      }
      scrollTicking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(updateScrollState);
        }
      },
      { passive: true }
    );
    updateScrollState();

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

    // Clipboard copy buttons with safe execCommand fallback
    const copyText = async (text) => {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await Promise.race([
            navigator.clipboard.writeText(text),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 250))
          ]);
          return;
        } catch (err) {
          // Fall back to textarea selection copy
        }
      }
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (!ok) {
        throw new Error('Copy command failed');
      }
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

    // Reading-safe periphery-weighted full-page Bayer mosaic backdrop
    const drawPageAmbientMosaic = () => {
      const canvas = document.getElementById('page-mosaic-bg');
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

      const isDark = root.getAttribute('data-theme') === 'dark';
      const stoneHex = isDark ? '#272623' : '#dfdad0';
      const clayHex = isDark ? '#e08668' : '#d97757';

      const halfClearPx = Math.min(rect.width * 0.48, 560);
      const hasOuterMargins = rect.width >= 1220;

      for (let r = 0; r < rows; r += 1) {
        const py = r * tile;
        const ny = r / rows;
        for (let c = 0; c < cols; c += 1) {
          const px = c * tile;
          const nx = c / cols;

          let clearance = 0;
          if (hasOuterMargins) {
            const distPx = Math.abs(px - rect.width * 0.5);
            if (distPx > halfClearPx) {
              const marginSpan = Math.max(40, rect.width * 0.5 - halfClearPx);
              clearance = Math.min(1, (distPx - halfClearPx) / (marginSpan * 0.55));
            }
          } else {
            const headerFade = py < 74 ? Math.max(0, 1 - py / 74) : 0;
            const cornerWeight = Math.abs(nx - 0.5) * 2;
            clearance = headerFade * Math.max(0, (cornerWeight - 0.48) / 0.52) * 0.45;
          }

          if (clearance <= 0.02) continue;

          const contourWave = 0.5 + 0.5 * Math.sin(nx * 9.0 + Math.cos(ny * 5.2) * 1.4);
          const density = contourWave * clearance * 0.72;

          if (bayerHit(c, r, density)) {
            const isSparseClay = contourWave > 0.88 && ((c * 7 + r * 11) % 29 === 0);
            ctx.fillStyle = isSparseClay ? clayHex : stoneHex;
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
    };

    // Crisp top-edge Bayer horizon on the full-bleed charcoal footer
    const drawFooterMosaic = () => {
      const canvas = document.getElementById('footer-mosaic');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const tile = 3;
      const cols = Math.ceil(rect.width / tile);
      const rows = Math.ceil(rect.height / tile);
      canvas.width = cols;
      canvas.height = rows;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cols, rows);

      for (let r = 0; r < rows; r += 1) {
        const ny = r / rows;
        for (let c = 0; c < cols; c += 1) {
          const nx = c / cols;
          const wave = 0.5 + 0.5 * Math.sin(nx * 7.2 + Math.cos(ny * 3.8) * 1.3);
          const fade = Math.max(0, 1 - ny * 1.05);
          const density = wave * fade * 0.88;

          if (bayerHit(c, r, density)) {
            if (ny < 0.25 && wave > 0.78) {
              ctx.fillStyle = '#faf9f5';
            } else if (wave > 0.85 && (c + r) % 7 === 0) {
              ctx.fillStyle = '#d97757';
            } else {
              ctx.fillStyle = '#6f6c64';
            }
            ctx.fillRect(c, r, 1, 1);
          }
        }
      }
    };

    const renderAllCanvases = () => {
      drawPageAmbientMosaic();
      drawFooterMosaic();
    };

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderAllCanvases, 140);
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
        drawPageAmbientMosaic();
      });
    }

    syncThemeUi();
    renderAllCanvases();
  });
})();
