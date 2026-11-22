(() => {
  'use strict';

  const SAMPLES = {
    canopy: {
      label: 'Vegetation Canopy',
      peak: '842 nm (NIR)',
      peakIdx: 4,
      points: [0.04, 0.09, 0.05, 0.24, 0.56, 0.54, 0.43, 0.28, 0.16]
    },
    soil: {
      label: 'Exposed Soil',
      peak: '1610 nm (SWIR-1)',
      peakIdx: 7,
      points: [0.11, 0.16, 0.23, 0.27, 0.32, 0.38, 0.44, 0.49, 0.42]
    },
    water: {
      label: 'Coastal Water',
      peak: '490 nm (Blue)',
      peakIdx: 0,
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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label');
    const menuToggle = document.getElementById('menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.obs-section');
    const railPlate = document.getElementById('rail-plate');
    const railFill = document.getElementById('rail-fill');
    const readout = document.getElementById('spectral-readout');
    const spectralNeedle = document.getElementById('spectral-needle');
    const bandTicks = document.querySelectorAll('.band-tick');
    const topoSvg = document.getElementById('topo-svg');
    const yearEl = document.getElementById('yr');
    const backTop = document.getElementById('back-top');

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    // Spectral calibration strip readout and sliding needle
    bandTicks.forEach((btn) => {
      const showBand = () => {
        if (readout) {
          readout.textContent = `${btn.dataset.band} band (${btn.dataset.wl})`;
        }
        if (spectralNeedle && btn.dataset.pos) {
          spectralNeedle.style.left = btn.dataset.pos;
          spectralNeedle.classList.add('active');
        }
      };
      const hideBand = () => {
        if (readout) readout.textContent = '400 to 2500 nm reference';
        if (spectralNeedle) spectralNeedle.classList.remove('active');
      };
      btn.addEventListener('mouseenter', showBand);
      btn.addEventListener('focus', showBand);
      btn.addEventListener('mouseleave', hideBand);
      btn.addEventListener('blur', hideBand);
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

    // Scrollspy, margin rail progress, and subtle contour parallax
    let parallaxTicking = false;
    const updateScrollEffects = () => {
      const y = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, y / maxScroll));
      if (railFill) {
        railFill.style.height = `${Math.max(12, Math.round(ratio * 100))}%`;
      }
      if (topoSvg && !reducedMotion) {
        topoSvg.style.transform = `translate3d(0, ${(-y * 0.055).toFixed(1)}px, 0)`;
      }
      parallaxTicking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!parallaxTicking) {
          parallaxTicking = true;
          requestAnimationFrame(updateScrollEffects);
        }
      },
      { passive: true }
    );
    updateScrollEffects();

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

    // Subtle 3D pointer tilt on portrait plate (desktop fine pointer only)
    const portraitStage = document.getElementById('portrait-stage');
    const portraitPlate = document.getElementById('portrait-plate');
    if (portraitStage && portraitPlate && finePointer && !reducedMotion) {
      portraitStage.addEventListener('mousemove', (event) => {
        const rect = portraitStage.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        portraitPlate.style.setProperty('--rx', `${(-ny * 6.5).toFixed(2)}deg`);
        portraitPlate.style.setProperty('--ry', `${(nx * 6.5).toFixed(2)}deg`);
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

    // Interactive 5-Layer 3D Spectral-Spatial Patch Inspector
    const canvas = document.getElementById('spectral-canvas');
    const sampleBtns = document.querySelectorAll('.sample-btn');
    const coordEl = document.getElementById('pixel-coord');
    const sampleNameEl = document.getElementById('sample-name');
    const peakBandEl = document.getElementById('peak-band');

    let currentSample = 'canopy';
    let targetCell = { row: 3, col: 3 };
    let displayedPoints = [...SAMPLES.canopy.points];
    let targetPoints = [...SAMPLES.canopy.points];
    let hoverChart = null;
    let patchGeometry = null;
    let chartGeometry = null;

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
        accentSoft: styles.getPropertyValue('--accent-soft').trim(),
        signalSoft: styles.getPropertyValue('--signal-soft').trim()
      };
    };

    const computeTargetPoints = () => {
      const base = SAMPLES[currentSample].points;
      const dx = (targetCell.col - 3) * 0.012;
      const dy = (targetCell.row - 3) * 0.008;
      return base.map((val, idx) => {
        const wave = Math.sin(idx * 0.9 + targetCell.col) * 0.014;
        return Math.min(0.85, Math.max(0.01, val + dx - dy + wave));
      });
    };

    const getIsoCellPolygon = (originX, originY, tileW, tileH, r, c, zOffset = 0) => {
      const toIso = (gx, gy) => ({
        x: originX + (gx - gy) * (tileW / 2),
        y: originY + (gx + gy) * (tileH / 2) + zOffset
      });
      return [
        toIso(c, r),
        toIso(c + 1, r),
        toIso(c + 1, r + 1),
        toIso(c, r + 1)
      ];
    };

    const tracePoly = (ctx, pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i += 1) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
    };

    const sampleCurveAtWl = (wl) => {
      for (let i = 0; i < WAVELENGTHS.length - 1; i += 1) {
        const w0 = WAVELENGTHS[i];
        const w1 = WAVELENGTHS[i + 1];
        if (wl >= w0 && wl <= w1) {
          const t = (wl - w0) / (w1 - w0);
          return displayedPoints[i] + (displayedPoints[i + 1] - displayedPoints[i]) * t;
        }
      }
      return displayedPoints[0];
    };

    const drawSchematic = (timeMs = 0) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const w = rect.width;
      const h = rect.height;
      const c = getPalette();

      ctx.clearRect(0, 0, w, h);

      const stacked = w < 500;
      const compact = w < 640;
      const gridSize = 7;
      const tileW = stacked ? 17 : compact ? 18 : 21;
      const tileH = stacked ? 8.5 : compact ? 9 : 10.5;
      const originX = stacked ? w * 0.5 : compact ? w * 0.23 : w * 0.22;
      const originY = stacked ? 16 : compact ? 28 : 34;
      const layerCount = 5;
      const layerGap = stacked ? 9 : 13;

      patchGeometry = { originX, originY, tileW, tileH, gridSize };

      const toIso = (gx, gy, z = 0) => ({
        x: originX + (gx - gy) * (tileW / 2),
        y: originY + (gx + gy) * (tileH / 2) + z
      });

      const layerOffsets = [];
      for (let i = 0; i < layerCount; i += 1) {
        const breath = reducedMotion ? 0 : Math.sin(timeMs * 0.0012 - i * 0.45) * 1.4;
        layerOffsets.push(i * layerGap + breath);
      }

      // Draw bottom 4 translucent spectral layers from deepest (index 4) upward to index 1
      for (let layer = layerCount - 1; layer >= 1; layer -= 1) {
        const z = layerOffsets[layer];
        const plane = [
          toIso(0, 0, z),
          toIso(gridSize, 0, z),
          toIso(gridSize, gridSize, z),
          toIso(0, gridSize, z)
        ];

        tracePoly(ctx, plane);
        ctx.save();
        ctx.globalAlpha = 0.72 - layer * 0.1;
        ctx.fillStyle = layer % 2 === 0 ? c.surfaceAlt : c.bg;
        ctx.fill();
        ctx.strokeStyle = c.borderStrong;
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();

        // Highlight target cell slice on lower layers
        const slicePoly = getIsoCellPolygon(originX, originY, tileW, tileH, targetCell.row, targetCell.col, z);
        tracePoly(ctx, slicePoly);
        ctx.fillStyle = c.signalSoft;
        ctx.fill();
        ctx.strokeStyle = c.signal;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      // Vertical prism edges connecting top target cell through all 5 spectral layers
      const zTop = layerOffsets[0];
      const zBot = layerOffsets[layerCount - 1];
      const topPoly = getIsoCellPolygon(originX, originY, tileW, tileH, targetCell.row, targetCell.col, zTop);
      const botPoly = getIsoCellPolygon(originX, originY, tileW, tileH, targetCell.row, targetCell.col, zBot);

      ctx.save();
      ctx.strokeStyle = c.signal;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      for (let corner = 0; corner < 4; corner += 1) {
        ctx.beginPath();
        ctx.moveTo(topPoly[corner].x, topPoly[corner].y);
        ctx.lineTo(botPoly[corner].x, botPoly[corner].y);
        ctx.stroke();
      }
      ctx.restore();

      // Top 7x7 spatial patch grid
      for (let r = 0; r < gridSize; r += 1) {
        for (let col = 0; col < gridSize; col += 1) {
          const poly = getIsoCellPolygon(originX, originY, tileW, tileH, r, col, zTop);
          const isCenter = r === 3 && col === 3;
          const isSelected = r === targetCell.row && col === targetCell.col;

          tracePoly(ctx, poly);
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
          ctx.lineWidth = isSelected ? 1.4 : 0.75;
          ctx.stroke();
        }
      }

      const selCenter = {
        x: (topPoly[0].x + topPoly[2].x) / 2,
        y: (topPoly[0].y + topPoly[2].y) / 2
      };

      const stackBottomY = originY + gridSize * tileH + layerOffsets[layerCount - 1];
      ctx.fillStyle = c.inkMuted;
      ctx.font = '10.5px "IBM Plex Mono", monospace';
      if (stacked) {
        ctx.textAlign = 'center';
        ctx.fillText('7x7 LAYERED SPECTRAL STACK', originX, stackBottomY + 18);
        ctx.textAlign = 'left';
      } else {
        ctx.fillText('7x7 LAYERED STACK', Math.max(10, originX - 58), stackBottomY + 22);
      }

      // Spectral reflectance chart
      const chartX = stacked ? 16 : compact ? w * 0.46 : w * 0.44;
      const chartY = stacked ? 196 : 32;
      const chartW = Math.max(120, w - chartX - 18);
      const chartH = stacked ? h - chartY - 30 : h - 72;

      const minLog = Math.log(440);
      const maxLog = Math.log(2350);
      const wlToX = (wl) => chartX + ((Math.log(wl) - minLog) / (maxLog - minLog)) * chartW;
      const xToWl = (px) => Math.exp(minLog + ((px - chartX) / chartW) * (maxLog - minLog));
      const refToY = (val) => chartY + chartH - Math.min(0.9, Math.max(0, val)) * (chartH / 0.8);

      chartGeometry = { chartX, chartY, chartW, chartH, xToWl };

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

      // Log-scaled wavelength axis markers with overlap prevention
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

      // Connector ray from selected patch cell to curve origin
      const rayEndX = wlToX(WAVELENGTHS[0]);
      const rayEndY = refToY(displayedPoints[0]);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = c.signal;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(selCenter.x, selCenter.y);
      ctx.lineTo(rayEndX, rayEndY);
      ctx.stroke();
      ctx.restore();

      // Subtle traveling sampling pulse along connector ray
      if (!reducedMotion) {
        const pulseT = (timeMs % 3200) / 3200;
        const pulseX = selCenter.x + (rayEndX - selCenter.x) * pulseT;
        const pulseY = selCenter.y + (rayEndY - selCenter.y) * pulseT;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 2.3, 0, Math.PI * 2);
        ctx.fillStyle = c.signal;
        ctx.fill();
      }

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

      // Sample nodes and peak concentric target ring
      const peakIdx = SAMPLES[currentSample].peakIdx;
      displayedPoints.forEach((val, idx) => {
        const px = wlToX(WAVELENGTHS[idx]);
        const py = refToY(val);
        if (idx === peakIdx) {
          ctx.beginPath();
          ctx.arc(px, py, 6.5, 0, Math.PI * 2);
          ctx.strokeStyle = c.signal;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === peakIdx ? c.signal : c.accent;
        ctx.fill();
      });

      // Chart hover crosshair readout
      if (hoverChart && hoverChart.x >= chartX && hoverChart.x <= chartX + chartW) {
        const wl = Math.min(2200, Math.max(490, xToWl(hoverChart.x)));
        const hx = wlToX(wl);
        const hy = refToY(sampleCurveAtWl(wl));
        const val = sampleCurveAtWl(wl);

        ctx.save();
        ctx.strokeStyle = c.signal;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, chartY);
        ctx.lineTo(hx, chartY + chartH);
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = c.bg;
        ctx.fill();
        ctx.strokeStyle = c.signal;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const tip = `${Math.round(wl)} nm · ${val.toFixed(2)}`;
        ctx.font = '10px "IBM Plex Mono", monospace';
        const tipW = ctx.measureText(tip).width + 10;
        const tipX = Math.min(chartX + chartW - tipW, Math.max(chartX, hx - tipW / 2));
        const tipY = Math.max(chartY + 4, hy - 22);
        ctx.fillStyle = c.bg;
        ctx.fillRect(tipX, tipY, tipW, 16);
        ctx.strokeStyle = c.borderStrong;
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tipX, tipY, tipW, 16);
        ctx.fillStyle = c.ink;
        ctx.fillText(tip, tipX + 5, tipY + 11.5);
      }

      ctx.fillStyle = c.inkMuted;
      ctx.font = '10.5px "IBM Plex Mono", monospace';
      ctx.fillText('REFLECTANCE PROFILE (LOG nm)', chartX, chartY - 10);
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

    const setTargetValues = () => {
      targetPoints = computeTargetPoints();
      if (reducedMotion) {
        displayedPoints = [...targetPoints];
        drawSchematic(0);
      }
    };

    sampleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sample = btn.dataset.sample;
        if (!sample || !SAMPLES[sample]) return;
        currentSample = sample;
        sampleBtns.forEach((b) => b.classList.toggle('active', b === btn));
        updateTelemetry();
        setTargetValues();
      });
    });

    if (canvas) {
      const handlePointer = (event) => {
        const rect = canvas.getBoundingClientRect();
        const mx = event.clientX - rect.left;
        const my = event.clientY - rect.top;

        if (patchGeometry) {
          const { originX, originY, tileW, tileH, gridSize } = patchGeometry;
          const dx = mx - originX;
          const dy = my - originY;
          const gx = Math.floor((dx / (tileW / 2) + dy / (tileH / 2)) / 2);
          const gy = Math.floor((dy / (tileH / 2) - dx / (tileW / 2)) / 2);

          if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
            if (targetCell.row !== gy || targetCell.col !== gx) {
              targetCell = { row: gy, col: gx };
              updateTelemetry();
              setTargetValues();
            }
          }
        }

        if (
          chartGeometry &&
          mx >= chartGeometry.chartX &&
          mx <= chartGeometry.chartX + chartGeometry.chartW &&
          my >= chartGeometry.chartY &&
          my <= chartGeometry.chartY + chartGeometry.chartH
        ) {
          hoverChart = { x: mx, y: my };
          if (reducedMotion) drawSchematic(0);
        } else if (hoverChart !== null) {
          hoverChart = null;
          if (reducedMotion) drawSchematic(0);
        }
      };

      canvas.addEventListener('mousemove', handlePointer);
      canvas.addEventListener('click', handlePointer);
      canvas.addEventListener('mouseleave', () => {
        hoverChart = null;
        if (reducedMotion) drawSchematic(0);
      });
      window.addEventListener('resize', () => drawSchematic(performance.now()));
    }

    // Animation loop for layered cube breathing, sampling pulse, and smooth curve interpolation
    const tickLoop = (now) => {
      displayedPoints = displayedPoints.map((cur, idx) => cur + (targetPoints[idx] - cur) * 0.18);
      drawSchematic(now);
      requestAnimationFrame(tickLoop);
    };

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
        if (reducedMotion) drawSchematic(0);
      });
    }

    syncThemeUi();
    updateTelemetry();
    if (reducedMotion) {
      drawSchematic(0);
    } else {
      requestAnimationFrame(tickLoop);
    }
  });
})();
