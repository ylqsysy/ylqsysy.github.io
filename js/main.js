(() => {
  'use strict';

  const SAMPLES = {
    canopy: {
      label: 'Vegetation Canopy',
      peak: '842 nm (NIR)',
      points: [0.04, 0.09, 0.05, 0.24, 0.56, 0.54, 0.43, 0.28, 0.16]
    },
    soil: {
      label: 'Exposed Soil',
      peak: '1610 nm (SWIR-1)',
      points: [0.11, 0.16, 0.23, 0.27, 0.32, 0.38, 0.44, 0.49, 0.42]
    },
    water: {
      label: 'Coastal Water',
      peak: '490 nm (Blue)',
      points: [0.14, 0.12, 0.07, 0.04, 0.02, 0.015, 0.01, 0.008, 0.006]
    }
  };

  const WAVELENGTHS = [490, 560, 665, 705, 842, 1100, 1380, 1610, 2200];
  const REF_BANDS = [
    { wl: 490, name: 'Blue' },
    { wl: 560, name: 'Green' },
    { wl: 665, name: 'Red' },
    { wl: 705, name: 'Red Edge' },
    { wl: 842, name: 'NIR' },
    { wl: 1610, name: 'SWIR-1' }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.obs-section');
    const railPlate = document.getElementById('rail-plate');
    const railFill = document.getElementById('rail-fill');
    const readout = document.getElementById('spectral-readout');
    const bandTicks = document.querySelectorAll('.band-tick');
    const yearEl = document.getElementById('yr');
    const backTop = document.getElementById('back-top');

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    // Spectral calibration strip readout
    bandTicks.forEach((btn) => {
      const showBand = () => {
        if (readout) {
          readout.textContent = `${btn.dataset.band} band (${btn.dataset.wl})`;
        }
      };
      btn.addEventListener('mouseenter', showBand);
      btn.addEventListener('focus', showBand);
      btn.addEventListener('mouseleave', () => {
        if (readout) readout.textContent = '400 to 2500 nm reference';
      });
    });

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

    // Scrollspy and margin rail progress
    const updateScrollProgress = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      if (railFill) {
        railFill.style.height = `${Math.max(12, Math.round(ratio * 100))}%`;
      }
    };

    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            const plate = entry.target.dataset.plate;
            navItems.forEach((item) => {
              item.classList.toggle('active', item.dataset.section === id);
            });
            if (railPlate && plate) {
              railPlate.textContent = plate;
            }
          });
        },
        { rootMargin: '-32% 0px -55% 0px', threshold: 0 }
      );
      sections.forEach((sec) => observer.observe(sec));
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // Back to top
    if (backTop) {
      backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // BibTeX toggle
    document.querySelectorAll('.bibtex-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');
        const panel = targetId ? document.getElementById(targetId) : null;
        if (!panel) return;
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        panel.hidden = expanded;
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

    // Interactive Spectral-Spatial Patch Inspector
    const canvas = document.getElementById('spectral-canvas');
    const sampleBtns = document.querySelectorAll('.sample-btn');
    const coordEl = document.getElementById('pixel-coord');
    const sampleNameEl = document.getElementById('sample-name');
    const peakBandEl = document.getElementById('peak-band');

    let currentSample = 'canopy';
    let targetCell = { row: 3, col: 3 };
    let displayedPoints = [...SAMPLES.canopy.points];
    let animFrame = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getPalette = () => {
      const styles = getComputedStyle(root);
      return {
        bg: styles.getPropertyValue('--surface').trim(),
        surfaceAlt: styles.getPropertyValue('--surface-alt').trim(),
        border: styles.getPropertyValue('--border').trim(),
        borderStrong: styles.getPropertyValue('--border-strong').trim(),
        ink: styles.getPropertyValue('--ink').trim(),
        inkMuted: styles.getPropertyValue('--ink-muted').trim(),
        accent: styles.getPropertyValue('--accent').trim(),
        signal: styles.getPropertyValue('--signal').trim(),
        accentSoft: styles.getPropertyValue('--accent-soft').trim()
      };
    };

    const getCellPoints = () => {
      const base = SAMPLES[currentSample].points;
      const dx = (targetCell.col - 3) * 0.012;
      const dy = (targetCell.row - 3) * 0.008;
      return base.map((val, idx) => {
        const wave = Math.sin(idx * 0.9 + targetCell.col) * 0.014;
        return Math.min(0.85, Math.max(0.01, val + dx - dy + wave));
      });
    };

    const getIsoCellPolygon = (originX, originY, tileW, tileH, r, c) => {
      const toIso = (gx, gy) => ({
        x: originX + (gx - gy) * (tileW / 2),
        y: originY + (gx + gy) * (tileH / 2)
      });
      return [
        toIso(c, r),
        toIso(c + 1, r),
        toIso(c + 1, r + 1),
        toIso(c, r + 1)
      ];
    };

    let patchGeometry = null;

    const drawSchematic = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const c = getPalette();

      ctx.clearRect(0, 0, w, h);

      const stacked = w < 500;
      const compact = w < 620;
      const gridSize = 7;
      const tileW = stacked ? 18 : compact ? 18 : 22;
      const tileH = stacked ? 9 : compact ? 9 : 11;
      const originX = stacked ? w * 0.5 : compact ? w * 0.23 : w * 0.22;
      const originY = stacked ? 16 : compact ? 32 : 42;
      const stackDepth = stacked ? 34 : compact ? 42 : 58;

      patchGeometry = { originX, originY, tileW, tileH, gridSize };

      const toIso = (gx, gy, z = 0) => ({
        x: originX + (gx - gy) * (tileW / 2),
        y: originY + (gx + gy) * (tileH / 2) + z
      });

      // Lower cube walls
      const pLeftTop = toIso(0, gridSize, 0);
      const pFrontTop = toIso(gridSize, gridSize, 0);
      const pRightTop = toIso(gridSize, 0, 0);
      const pLeftBot = toIso(0, gridSize, stackDepth);
      const pFrontBot = toIso(gridSize, gridSize, stackDepth);
      const pRightBot = toIso(gridSize, 0, stackDepth);

      ctx.fillStyle = c.surfaceAlt;
      ctx.beginPath();
      ctx.moveTo(pLeftTop.x, pLeftTop.y);
      ctx.lineTo(pFrontTop.x, pFrontTop.y);
      ctx.lineTo(pFrontBot.x, pFrontBot.y);
      ctx.lineTo(pLeftBot.x, pLeftBot.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c.borderStrong;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pFrontTop.x, pFrontTop.y);
      ctx.lineTo(pRightTop.x, pRightTop.y);
      ctx.lineTo(pRightBot.x, pRightBot.y);
      ctx.lineTo(pFrontBot.x, pFrontBot.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spectral layer striations on cube walls
      for (let s = 1; s <= 4; s += 1) {
        const z = (stackDepth / 5) * s;
        const a = toIso(0, gridSize, z);
        const b = toIso(gridSize, gridSize, z);
        const d = toIso(gridSize, 0, z);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = c.border;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Top 7x7 spatial grid
      for (let r = 0; r < gridSize; r += 1) {
        for (let col = 0; col < gridSize; col += 1) {
          const poly = getIsoCellPolygon(originX, originY, tileW, tileH, r, col);
          const isCenter = r === 3 && col === 3;
          const isSelected = r === targetCell.row && col === targetCell.col;

          ctx.beginPath();
          ctx.moveTo(poly[0].x, poly[0].y);
          ctx.lineTo(poly[1].x, poly[1].y);
          ctx.lineTo(poly[2].x, poly[2].y);
          ctx.lineTo(poly[3].x, poly[3].y);
          ctx.closePath();

          if (isSelected) {
            ctx.fillStyle = c.signal;
            ctx.fill();
          } else if (isCenter) {
            ctx.fillStyle = c.accentSoft;
            ctx.fill();
          } else {
            ctx.fillStyle = c.bg;
            ctx.fill();
          }
          ctx.strokeStyle = isSelected ? c.signal : c.borderStrong;
          ctx.lineWidth = isSelected ? 1.4 : 0.8;
          ctx.stroke();
        }
      }

      const selPoly = getIsoCellPolygon(originX, originY, tileW, tileH, targetCell.row, targetCell.col);
      const selCenter = {
        x: (selPoly[0].x + selPoly[2].x) / 2,
        y: (selPoly[0].y + selPoly[2].y) / 2
      };

      // Cube label
      ctx.fillStyle = c.inkMuted;
      ctx.font = '10.5px "IBM Plex Mono", monospace';
      if (stacked) {
        ctx.textAlign = 'center';
        ctx.fillText('7x7 SPATIAL PATCH', originX, originY + gridSize * tileH + stackDepth + 18);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText('7x7 SPATIAL PATCH', Math.max(12, originX - 66), originY + gridSize * tileH + stackDepth + 24);
      }

      // Spectral reflectance chart (logarithmic wavelength axis for legible visible/NIR separation)
      const chartX = stacked ? 16 : compact ? w * 0.46 : w * 0.44;
      const chartY = stacked ? 186 : 30;
      const chartW = Math.max(120, w - chartX - 18);
      const chartH = stacked ? h - chartY - 30 : h - 72;

      // Chart horizontal grid
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g += 1) {
        const gy = chartY + (chartH / 4) * g;
        ctx.beginPath();
        ctx.moveTo(chartX, gy);
        ctx.lineTo(chartX + chartW, gy);
        ctx.stroke();
      }

      // Log-scaled wavelength axis
      const minLog = Math.log(440);
      const maxLog = Math.log(2350);
      const wlToX = (wl) => chartX + ((Math.log(wl) - minLog) / (maxLog - minLog)) * chartW;
      const refToY = (val) => chartY + chartH - Math.min(0.9, Math.max(0, val)) * (chartH / 0.8);

      let lastLabelRight = -Infinity;
      ctx.font = '10px "IBM Plex Mono", monospace';
      REF_BANDS.forEach((band) => {
        const bx = wlToX(band.wl);
        ctx.save();
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = c.border;
        ctx.beginPath();
        ctx.moveTo(bx, chartY);
        ctx.lineTo(bx, chartY + chartH);
        ctx.stroke();
        ctx.restore();

        const label = String(band.wl);
        const labelW = ctx.measureText(label).width;
        const labelX = Math.min(chartX + chartW - labelW, Math.max(chartX, bx - labelW / 2));
        if (labelX > lastLabelRight + 8) {
          ctx.fillStyle = c.inkMuted;
          ctx.fillText(label, labelX, chartY + chartH + 16);
          lastLabelRight = labelX + labelW;
        }
      });

      // Connector ray from selected patch cell to chart origin
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = c.signal;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(selCenter.x, selCenter.y);
      ctx.lineTo(wlToX(WAVELENGTHS[0]), refToY(displayedPoints[0]));
      ctx.stroke();
      ctx.restore();

      // Area under reflectance curve
      ctx.beginPath();
      displayedPoints.forEach((val, idx) => {
        const px = wlToX(WAVELENGTHS[idx]);
        const py = refToY(val);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.lineTo(wlToX(WAVELENGTHS[WAVELENGTHS.length - 1]), chartY + chartH);
      ctx.lineTo(wlToX(WAVELENGTHS[0]), chartY + chartH);
      ctx.closePath();
      ctx.fillStyle = c.accentSoft;
      ctx.fill();

      // Curve stroke
      ctx.beginPath();
      displayedPoints.forEach((val, idx) => {
        const px = wlToX(WAVELENGTHS[idx]);
        const py = refToY(val);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Sample nodes
      displayedPoints.forEach((val, idx) => {
        const px = wlToX(WAVELENGTHS[idx]);
        const py = refToY(val);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === 4 ? c.signal : c.accent;
        ctx.fill();
      });

      ctx.fillStyle = c.inkMuted;
      ctx.font = '10.5px "IBM Plex Mono", monospace';
      ctx.fillText('REFLECTANCE PROFILE (LOG nm)', chartX, chartY - 10);
    };

    const animateToTarget = () => {
      const next = getCellPoints();
      if (reducedMotion) {
        displayedPoints = next;
        drawSchematic();
        return;
      }

      if (animFrame) cancelAnimationFrame(animFrame);

      const step = () => {
        let diff = 0;
        displayedPoints = displayedPoints.map((cur, idx) => {
          const delta = next[idx] - cur;
          diff += Math.abs(delta);
          return cur + delta * 0.22;
        });
        drawSchematic();
        if (diff > 0.002) {
          animFrame = requestAnimationFrame(step);
        } else {
          displayedPoints = next;
          drawSchematic();
        }
      };

      animFrame = requestAnimationFrame(step);
    };

    const updateTelemetry = () => {
      if (coordEl) {
        const tag = targetCell.row === 3 && targetCell.col === 3 ? 'Center' : 'Context';
        coordEl.textContent = `(${targetCell.row}, ${targetCell.col}) · ${tag}`;
      }
      if (sampleNameEl) {
        sampleNameEl.textContent = SAMPLES[currentSample].label;
      }
      if (peakBandEl) {
        peakBandEl.textContent = SAMPLES[currentSample].peak;
      }
    };

    sampleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sample = btn.dataset.sample;
        if (!sample || !SAMPLES[sample]) return;
        currentSample = sample;
        sampleBtns.forEach((b) => b.classList.toggle('active', b === btn));
        updateTelemetry();
        animateToTarget();
      });
    });

    if (canvas) {
      const handlePointer = (event) => {
        if (!patchGeometry) return;
        const rect = canvas.getBoundingClientRect();
        const mx = event.clientX - rect.left;
        const my = event.clientY - rect.top;
        const { originX, originY, tileW, tileH, gridSize } = patchGeometry;

        const dx = mx - originX;
        const dy = my - originY;
        const gx = Math.floor((dx / (tileW / 2) + dy / (tileH / 2)) / 2);
        const gy = Math.floor((dy / (tileH / 2) - dx / (tileW / 2)) / 2);

        if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
          if (targetCell.row !== gy || targetCell.col !== gx) {
            targetCell = { row: gy, col: gx };
            updateTelemetry();
            animateToTarget();
          }
        }
      };

      canvas.addEventListener('mousemove', handlePointer);
      canvas.addEventListener('click', handlePointer);
      window.addEventListener('resize', drawSchematic);
    }

    // Theme toggle sync
    const syncThemeUi = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (themeLabel) {
        themeLabel.textContent = isDark ? 'Archival Paper' : 'Night Pass';
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
        drawSchematic();
      });
    }

    syncThemeUi();
    updateTelemetry();
    drawSchematic();
  });
})();
