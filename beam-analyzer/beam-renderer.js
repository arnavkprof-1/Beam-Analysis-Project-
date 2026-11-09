/**
 * High-DPI Canvas Renderer for:
 * 1. Beam Schematic Diagram (Beam, Supports, Reactions, Point Loads, UDLs, Moments)
 * 2. Shear Force Diagram (SFD)
 * 3. Bending Moment Diagram (BMD)
 * With Linked Synchronized Crosshairs & Floating Diagnostic HUD
 */

export class BeamRenderer {
  constructor(canvases, options = {}) {
    this.beamCanvas = canvases.beam;
    this.sfdCanvas = canvases.sfd;
    this.bmdCanvas = canvases.bmd;

    this.beamCtx = this.beamCanvas.getContext('2d');
    this.sfdCtx = this.sfdCanvas.getContext('2d');
    this.bmdCtx = this.bmdCanvas.getContext('2d');

    this.isDarkMode = options.isDarkMode ?? true;
    this.hoverX = null; // in meters along beam
    this.activeCanvas = null;

    this.padding = { left: 75, right: 40, top: 50, bottom: 40 };

    this.initEvents();
  }

  setTheme(isDark) {
    this.isDarkMode = isDark;
  }

  resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const displayW = Math.max(100, Math.round(rect.width || canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 700)));
    const displayH = Math.max(80, Math.round(rect.height || canvas.clientHeight || (canvas.parentElement ? canvas.parentElement.clientHeight : 200)));

    const targetW = Math.round(displayW * dpr);
    const targetH = Math.round(displayH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
      width: displayW,
      height: displayH,
      dpr
    };
  }

  initEvents() {
    const canvases = [this.beamCanvas, this.sfdCanvas, this.bmdCanvas];

    canvases.forEach(canvas => {
      const handlePointer = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        if (clientX === null) return;

        const px = clientX - rect.left;
        const beamW = rect.width - this.padding.left - this.padding.right;

        if (px >= this.padding.left && px <= rect.width - this.padding.right) {
          const ratio = (px - this.padding.left) / beamW;
          this.hoverX = Math.max(0, Math.min(this.engine.length, ratio * this.engine.length));
        } else if (px < this.padding.left) {
          this.hoverX = 0;
        } else {
          this.hoverX = this.engine.length;
        }

        this.renderAll();
        if (this.onInspectCallback) {
          this.onInspectCallback(this.hoverX, e.clientX, e.clientY);
        }
      };

      canvas.addEventListener('mousemove', handlePointer);
      canvas.addEventListener('touchmove', handlePointer, { passive: true });

      const handleLeave = () => {
        this.hoverX = null;
        this.renderAll();
        if (this.onInspectCallback) {
          this.onInspectCallback(null);
        }
      };

      canvas.addEventListener('mouseleave', handleLeave);
      canvas.addEventListener('touchend', handleLeave);
    });
  }

  onInspect(callback) {
    this.onInspectCallback = callback;
  }

  render(engine, solution) {
    this.engine = engine;
    this.solution = solution;
    this.renderAll();
  }

  renderAll() {
    if (!this.engine || !this.solution) return;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => {
      this.renderBeamSchematic();
      this.renderSFD();
      this.renderBMD();
    });
  }

  getColors() {
    if (this.isDarkMode) {
      return {
        bg: '#0f172a',
        cardBg: '#1e293b',
        grid: 'rgba(255, 255, 255, 0.07)',
        axis: '#64748b',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        beamBody: '#475569',
        beamFlange: '#334155',
        support: '#94a3b8',
        reaction: '#10b981', // emerald
        pointLoad: '#f59e0b', // amber
        udl: '#06b6d4', // cyan
        moment: '#a855f7', // purple
        sfdLine: '#06b6d4',
        sfdFillPos: 'rgba(6, 182, 212, 0.35)',
        sfdFillNeg: 'rgba(244, 63, 94, 0.35)',
        bmdLine: '#6366f1',
        bmdFillSag: 'rgba(16, 185, 129, 0.35)',
        bmdFillHog: 'rgba(168, 85, 247, 0.35)',
        crosshair: '#e2e8f0',
        crosshairGlow: 'rgba(99, 102, 241, 0.6)',
        highlight: '#38bdf8'
      };
    } else {
      return {
        bg: '#ffffff',
        cardBg: '#f8fafc',
        grid: 'rgba(0, 0, 0, 0.06)',
        axis: '#94a3b8',
        text: '#0f172a',
        textMuted: '#64748b',
        beamBody: '#cbd5e1',
        beamFlange: '#94a3b8',
        support: '#475569',
        reaction: '#059669',
        pointLoad: '#d97706',
        udl: '#0891b2',
        moment: '#9333ea',
        sfdLine: '#0891b2',
        sfdFillPos: 'rgba(8, 145, 178, 0.25)',
        sfdFillNeg: 'rgba(225, 29, 72, 0.25)',
        bmdLine: '#4f46e5',
        bmdFillSag: 'rgba(5, 150, 105, 0.25)',
        bmdFillHog: 'rgba(147, 51, 234, 0.25)',
        crosshair: '#0f172a',
        crosshairGlow: 'rgba(79, 70, 229, 0.4)',
        highlight: '#0284c7'
      };
    }
  }

  // Conversion: x in meters to canvas px
  metersToPx(x, beamWidth) {
    return this.padding.left + (x / this.engine.length) * beamWidth;
  }

  /**
   * 1. BEAM SCHEMATIC RENDERING
   */
  renderBeamSchematic() {
    const ctx = this.beamCtx;
    const { width, height } = this.resizeCanvas(this.beamCanvas, ctx);
    const colors = this.getColors();
    const beamW = width - this.padding.left - this.padding.right;
    const beamY = height * 0.58; // beam centerline
    const beamThickness = 14;

    ctx.clearRect(0, 0, width, height);

    // Dimension baseline and tick markers
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    const numTicks = Math.min(10, Math.ceil(this.engine.length));
    for (let i = 0; i <= numTicks; i++) {
      const xVal = (i / numTicks) * this.engine.length;
      const px = this.metersToPx(xVal, beamW);

      ctx.beginPath();
      ctx.moveTo(px, this.padding.top - 10);
      ctx.lineTo(px, height - 15);
      ctx.stroke();

      ctx.fillStyle = colors.textMuted;
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${xVal.toFixed(1)}m`, px, height - 4);
    }

    // Draw UDL Blocks (rendered above beam)
    for (const udl of this.engine.udlLoads) {
      this.drawUDL(ctx, udl, beamW, beamY - beamThickness / 2, colors);
    }

    // Draw Beam Member (I-Beam silhouette with 3D bevel)
    const beamStartPx = this.metersToPx(0, beamW);
    const beamEndPx = this.metersToPx(this.engine.length, beamW);

    // Beam drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = colors.beamBody;
    ctx.beginPath();
    ctx.roundRect?.(beamStartPx, beamY - beamThickness / 2, beamEndPx - beamStartPx, beamThickness, 3);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Flange top and bottom borders
    ctx.strokeStyle = colors.beamFlange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(beamStartPx, beamY - beamThickness / 2);
    ctx.lineTo(beamEndPx, beamY - beamThickness / 2);
    ctx.moveTo(beamStartPx, beamY + beamThickness / 2);
    ctx.lineTo(beamEndPx, beamY + beamThickness / 2);
    ctx.stroke();

    // Centerline dashed guide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(beamStartPx, beamY);
    ctx.lineTo(beamEndPx, beamY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Supports
    this.drawSupports(ctx, beamW, beamY + beamThickness / 2, colors);

    // Draw Reactions
    this.drawReactions(ctx, beamW, beamY + beamThickness / 2, colors);

    // Draw Point Loads
    for (const pl of this.engine.pointLoads) {
      this.drawPointLoad(ctx, pl, beamW, beamY - beamThickness / 2, colors);
    }

    // Draw Applied Concentrated Moments
    for (const m of this.engine.moments) {
      this.drawMoment(ctx, m, beamW, beamY, colors);
    }

    // Synchronized Crosshair on Beam
    if (this.hoverX !== null) {
      const hx = this.metersToPx(this.hoverX, beamW);
      this.drawCrosshairLine(ctx, hx, 0, height, colors);
    }
  }

  drawSupports(ctx, beamW, yPos, colors) {
    const type = this.engine.supportType;

    if (type === 'cantilever-left') {
      const x = this.metersToPx(0, beamW);
      this.drawFixedSupport(ctx, x, yPos - 7, 'left', colors);
      return;
    }
    if (type === 'cantilever-right') {
      const x = this.metersToPx(this.engine.length, beamW);
      this.drawFixedSupport(ctx, x, yPos - 7, 'right', colors);
      return;
    }

    // Two supports: Support A & B
    const posA = this.metersToPx(this.engine.supportA.x, beamW);
    const posB = this.metersToPx(this.engine.supportB.x, beamW);

    this.drawPinSupport(ctx, posA, yPos, 'Support A (Pinned)', colors);
    this.drawRollerSupport(ctx, posB, yPos, 'Support B (Roller)', colors);
  }

  drawPinSupport(ctx, x, y, label, colors) {
    const size = 16;
    ctx.save();

    // Pin pivot dot
    ctx.fillStyle = colors.text;
    ctx.beginPath();
    ctx.arc(x, y + 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Triangle
    ctx.fillStyle = colors.support;
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x - size * 0.7, y + size + 2);
    ctx.lineTo(x + size * 0.7, y + size + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ground hatching
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - size, y + size + 4);
    ctx.lineTo(x + size, y + size + 4);
    ctx.stroke();

    for (let i = -size; i <= size; i += 6) {
      ctx.beginPath();
      ctx.moveTo(x + i, y + size + 4);
      ctx.lineTo(x + i - 4, y + size + 10);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawRollerSupport(ctx, x, y, label, colors) {
    const size = 16;
    ctx.save();

    // Pivot dot
    ctx.fillStyle = colors.text;
    ctx.beginPath();
    ctx.arc(x, y + 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Triangle
    ctx.fillStyle = colors.support;
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x - size * 0.7, y + size);
    ctx.lineTo(x + size * 0.7, y + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Roller wheels (2 circles)
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(x - 5, y + size + 4, 3, 0, Math.PI * 2);
    ctx.arc(x + 5, y + size + 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ground line
    ctx.beginPath();
    ctx.moveTo(x - size, y + size + 8);
    ctx.lineTo(x + size, y + size + 8);
    ctx.stroke();

    ctx.restore();
  }

  drawFixedSupport(ctx, x, y, side, colors) {
    const h = 48;
    const w = 12;
    ctx.save();

    ctx.fillStyle = colors.support;
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 2;

    const leftX = side === 'left' ? x - w : x;
    ctx.fillRect(leftX, y - h / 2, w, h);
    ctx.strokeRect(leftX, y - h / 2, w, h);

    // Hatch lines
    ctx.lineWidth = 1.5;
    for (let dy = -h / 2; dy <= h / 2; dy += 8) {
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(x - w, y + dy);
        ctx.lineTo(x - w - 6, y + dy + 6);
      } else {
        ctx.moveTo(x + w, y + dy);
        ctx.lineTo(x + w + 6, y + dy + 6);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  drawReactions(ctx, beamW, yPos, colors) {
    const r = this.solution.reactions;
    if (!r || !r.isStable) return;

    if (this.engine.supportType === 'two-supports') {
      this.drawReactionVector(ctx, this.metersToPx(r.posA, beamW), yPos + 22, r.R1, 'R_A', colors);
      this.drawReactionVector(ctx, this.metersToPx(r.posB, beamW), yPos + 22, r.R2, 'R_B', colors);
    } else if (this.engine.supportType === 'cantilever-left') {
      this.drawReactionVector(ctx, this.metersToPx(0, beamW), yPos + 18, r.R1, 'R_fixed', colors);
    } else if (this.engine.supportType === 'cantilever-right') {
      this.drawReactionVector(ctx, this.metersToPx(this.engine.length, beamW), yPos + 18, r.R2, 'R_fixed', colors);
    }
  }

  drawReactionVector(ctx, x, y, mag, name, colors) {
    ctx.save();
    const arrowLen = 32;
    const isUpward = mag >= 0;
    const color = colors.reaction;

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    // Arrow line
    const yStart = isUpward ? y + arrowLen : y - arrowLen;
    const yEnd = y;

    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yEnd);
    ctx.stroke();

    // Arrowhead
    const tipDir = isUpward ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x, yEnd);
    ctx.lineTo(x - 5, yEnd - tipDir * 8);
    ctx.lineTo(x + 5, yEnd - tipDir * 8);
    ctx.closePath();
    ctx.fill();

    // Text badge with reaction magnitude
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const textY = isUpward ? yStart + 13 : yStart - 6;
    ctx.fillText(`${name}: ${Math.abs(mag).toFixed(1)} kN`, x, textY);

    ctx.restore();
  }

  drawPointLoad(ctx, pl, beamW, yPos, colors) {
    const x = this.metersToPx(pl.x, beamW);
    const arrowLen = Math.min(55, Math.max(28, 22 + Math.abs(pl.magnitude) * 0.6));
    const isDown = pl.magnitude >= 0;
    const color = colors.pointLoad;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    const yStart = isDown ? yPos - arrowLen : yPos + arrowLen;
    const yEnd = yPos;

    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yEnd);
    ctx.stroke();

    // Arrowhead
    const tipDir = isDown ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, yEnd);
    ctx.lineTo(x - 5, yEnd - tipDir * 9);
    ctx.lineTo(x + 5, yEnd - tipDir * 9);
    ctx.closePath();
    ctx.fill();

    // Load Label Pill
    const labelText = `${pl.label ? pl.label + ': ' : ''}${Math.abs(pl.magnitude)} kN`;
    ctx.font = 'bold 10px "Inter", sans-serif';
    const textMetrics = ctx.measureText(labelText);
    const pillW = textMetrics.width + 12;
    const pillH = 18;
    const pillY = isDown ? yStart - pillH - 2 : yStart + 2;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(x - pillW / 2, pillY, pillW, pillH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(labelText, x, pillY + 12);

    ctx.restore();
  }

  drawUDL(ctx, udl, beamW, yPos, colors) {
    const x1 = this.metersToPx(udl.x1, beamW);
    const x2 = this.metersToPx(udl.x2, beamW);
    const spanW = x2 - x1;
    if (spanW <= 0) return;

    const blockH = Math.min(36, Math.max(18, 14 + Math.abs(udl.magnitude) * 0.8));
    const color = colors.udl;

    ctx.save();

    // Shaded box above beam
    ctx.fillStyle = this.isDarkMode ? 'rgba(6, 182, 212, 0.15)' : 'rgba(8, 145, 178, 0.15)';
    ctx.fillRect(x1, yPos - blockH, spanW, blockH);

    // Box top line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, yPos - blockH);
    ctx.lineTo(x2, yPos - blockH);
    ctx.stroke();

    // Array of small downward arrows
    const arrowSpacing = Math.max(14, Math.min(24, spanW / 12));
    const count = Math.floor(spanW / arrowSpacing);

    ctx.fillStyle = color;
    for (let i = 0; i <= count; i++) {
      const ax = x1 + (i / count) * spanW;
      ctx.beginPath();
      ctx.moveTo(ax, yPos - blockH);
      ctx.lineTo(ax, yPos);
      ctx.stroke();

      // Arrowhead at bottom touching beam
      ctx.beginPath();
      ctx.moveTo(ax, yPos);
      ctx.lineTo(ax - 3.5, yPos - 6);
      ctx.lineTo(ax + 3.5, yPos - 6);
      ctx.closePath();
      ctx.fill();
    }

    // Label on top
    const labelText = `${udl.label ? udl.label + ': ' : ''}${Math.abs(udl.magnitude)} kN/m`;
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.textAlign = 'center';

    const midX = (x1 + x2) / 2;
    ctx.fillStyle = colors.cardBg;
    const tw = ctx.measureText(labelText).width + 10;
    ctx.fillRect(midX - tw / 2, yPos - blockH - 14, tw, 14);
    ctx.strokeStyle = color;
    ctx.strokeRect(midX - tw / 2, yPos - blockH - 14, tw, 14);

    ctx.fillStyle = color;
    ctx.fillText(labelText, midX, yPos - blockH - 3);

    ctx.restore();
  }

  drawMoment(ctx, m, beamW, yPos, colors) {
    const x = this.metersToPx(m.x, beamW);
    const radius = 18;
    const isCW = m.magnitude >= 0;
    const color = colors.moment;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;

    // Curved circular arc
    ctx.beginPath();
    const startAngle = isCW ? Math.PI * 0.2 : Math.PI * 1.8;
    const endAngle = isCW ? Math.PI * 1.6 : Math.PI * 0.4;
    ctx.arc(x, yPos - 12, radius, startAngle, endAngle, !isCW);
    ctx.stroke();

    // Arrowhead on arc tip
    const tipAngle = endAngle;
    const tipX = x + radius * Math.cos(tipAngle);
    const tipY = (yPos - 12) + radius * Math.sin(tipAngle);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Text label
    const labelText = `${m.label ? m.label + ': ' : ''}${Math.abs(m.magnitude)} kN·m ${isCW ? '↻' : '↺'}`;
    ctx.font = 'bold 10px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(labelText, x, yPos - radius - 16);

    ctx.restore();
  }

  /**
   * 2. SHEAR FORCE DIAGRAM (SFD) RENDERING
   */
  renderSFD() {
    const ctx = this.sfdCtx;
    const { width, height } = this.resizeCanvas(this.sfdCanvas, ctx);
    const colors = this.getColors();
    const beamW = width - this.padding.left - this.padding.right;
    const plotH = height - this.padding.top - this.padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const points = this.solution.points;
    if (!points || points.length === 0) return;

    // Determine scale: max absolute V with padding
    const maxAbsV = Math.max(1, this.solution.diagnostics.maxAbsV * 1.25);
    const zeroY = this.padding.top + plotH / 2;

    // Draw Grid and Axis
    this.drawDiagramGrid(ctx, width, height, beamW, plotH, zeroY, maxAbsV, 'kN', colors);

    // Draw SFD Polygons (Separated by positive & negative fills)
    ctx.save();
    ctx.lineWidth = 2;

    // Path for gradient fills
    // Positive Fill (Cyan/Blue gradient)
    const posGrad = ctx.createLinearGradient(0, this.padding.top, 0, zeroY);
    posGrad.addColorStop(0, colors.sfdFillPos);
    posGrad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');

    // Negative Fill (Rose/Amber gradient)
    const negGrad = ctx.createLinearGradient(0, zeroY, 0, height - this.padding.bottom);
    negGrad.addColorStop(0, 'rgba(244, 63, 94, 0.02)');
    negGrad.addColorStop(1, colors.sfdFillNeg);

    // 1. Positive Region Fill (Single Batched Draw Call with Clip to upper half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.padding.left, this.padding.top, beamW, plotH / 2);
    ctx.clip();

    ctx.fillStyle = posGrad;
    ctx.beginPath();
    ctx.moveTo(this.metersToPx(points[0].x, beamW), zeroY);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(this.metersToPx(points[i].x, beamW), zeroY - (points[i].V / maxAbsV) * (plotH / 2));
    }
    ctx.lineTo(this.metersToPx(points[points.length - 1].x, beamW), zeroY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Negative Region Fill (Single Batched Draw Call with Clip to lower half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.padding.left, zeroY, beamW, plotH / 2);
    ctx.clip();

    ctx.fillStyle = negGrad;
    ctx.beginPath();
    ctx.moveTo(this.metersToPx(points[0].x, beamW), zeroY);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(this.metersToPx(points[i].x, beamW), zeroY - (points[i].V / maxAbsV) * (plotH / 2));
    }
    ctx.lineTo(this.metersToPx(points[points.length - 1].x, beamW), zeroY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Main line plot of V(x)
    ctx.strokeStyle = colors.sfdLine;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = this.metersToPx(points[i].x, beamW);
      const py = zeroY - (points[i].V / maxAbsV) * (plotH / 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Highlight Zero Shear Points
    for (const zp of this.solution.diagnostics.zeroShearPoints) {
      const zx = this.metersToPx(zp.x, beamW);
      this.drawMarker(ctx, zx, zeroY, '#f59e0b', 'V = 0', `${zp.x}m`, colors);
    }

    ctx.restore();

    // Synchronized Crosshair
    if (this.hoverX !== null) {
      const hx = this.metersToPx(this.hoverX, beamW);
      this.drawCrosshairLine(ctx, hx, 0, height, colors);

      // Active value dot
      const val = this.engine.evaluateAt(this.hoverX, this.solution.reactions);
      const hy = zeroY - (val.V / maxAbsV) * (plotH / 2);
      this.drawCrosshairDot(ctx, hx, hy, colors.sfdLine, colors);
    }
  }

  /**
   * 3. BENDING MOMENT DIAGRAM (BMD) RENDERING
   */
  renderBMD() {
    const ctx = this.bmdCtx;
    const { width, height } = this.resizeCanvas(this.bmdCanvas, ctx);
    const colors = this.getColors();
    const beamW = width - this.padding.left - this.padding.right;
    const plotH = height - this.padding.top - this.padding.bottom;

    ctx.clearRect(0, 0, width, height);

    const points = this.solution.points;
    if (!points || points.length === 0) return;

    // Determine scale: max absolute M
    const maxAbsM = Math.max(1, this.solution.diagnostics.maxAbsM * 1.25);
    const zeroY = this.padding.top + plotH / 2;

    // Draw Grid and Axis
    this.drawDiagramGrid(ctx, width, height, beamW, plotH, zeroY, maxAbsM, 'kN·m', colors);

    ctx.save();
    ctx.lineWidth = 2.2;

    // Gradients
    const sagGrad = ctx.createLinearGradient(0, this.padding.top, 0, zeroY);
    sagGrad.addColorStop(0, colors.bmdFillSag);
    sagGrad.addColorStop(1, 'rgba(16, 185, 129, 0.02)');

    const hogGrad = ctx.createLinearGradient(0, zeroY, 0, height - this.padding.bottom);
    hogGrad.addColorStop(0, 'rgba(168, 85, 247, 0.02)');
    hogGrad.addColorStop(1, colors.bmdFillHog);

    // 1. Sagging Region Fill (Batched single draw call with clip to upper half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.padding.left, this.padding.top, beamW, plotH / 2);
    ctx.clip();

    ctx.fillStyle = sagGrad;
    ctx.beginPath();
    ctx.moveTo(this.metersToPx(points[0].x, beamW), zeroY);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(this.metersToPx(points[i].x, beamW), zeroY - (points[i].M / maxAbsM) * (plotH / 2));
    }
    ctx.lineTo(this.metersToPx(points[points.length - 1].x, beamW), zeroY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Hogging Region Fill (Batched single draw call with clip to lower half)
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.padding.left, zeroY, beamW, plotH / 2);
    ctx.clip();

    ctx.fillStyle = hogGrad;
    ctx.beginPath();
    ctx.moveTo(this.metersToPx(points[0].x, beamW), zeroY);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(this.metersToPx(points[i].x, beamW), zeroY - (points[i].M / maxAbsM) * (plotH / 2));
    }
    ctx.lineTo(this.metersToPx(points[points.length - 1].x, beamW), zeroY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // BMD Solid Curve
    ctx.strokeStyle = colors.bmdLine;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = this.metersToPx(points[i].x, beamW);
      const py = zeroY - (points[i].M / maxAbsM) * (plotH / 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Mark Peak Sagging Moment (Max M)
    const d = this.solution.diagnostics;
    if (d.maxM !== -Infinity && Math.abs(d.maxM) > 0.01) {
      const mx = this.metersToPx(d.maxMPos, beamW);
      const my = zeroY - (d.maxM / maxAbsM) * (plotH / 2);
      this.drawMomentBadge(ctx, mx, my, `M_max = ${d.maxM} kN·m`, colors.reaction, colors);
    }

    // Mark Peak Hogging Moment (Min M)
    if (d.minM !== Infinity && Math.abs(d.minM) > 0.01 && d.minM < 0) {
      const mx = this.metersToPx(d.minMPos, beamW);
      const my = zeroY - (d.minM / maxAbsM) * (plotH / 2);
      this.drawMomentBadge(ctx, mx, my, `M_min = ${d.minM} kN·m`, colors.moment, colors);
    }

    // Mark Points of Contraflexure (M = 0)
    for (const cp of d.contraflexurePoints) {
      const cx = this.metersToPx(cp.x, beamW);
      this.drawDiamondMarker(ctx, cx, zeroY, '#38bdf8', 'Inflection Point', `${cp.x}m`, colors);
    }

    ctx.restore();

    // Synchronized Crosshair
    if (this.hoverX !== null) {
      const hx = this.metersToPx(this.hoverX, beamW);
      this.drawCrosshairLine(ctx, hx, 0, height, colors);

      const val = this.engine.evaluateAt(this.hoverX, this.solution.reactions);
      const hy = zeroY - (val.M / maxAbsM) * (plotH / 2);
      this.drawCrosshairDot(ctx, hx, hy, colors.bmdLine, colors);
    }
  }

  drawDiagramGrid(ctx, width, height, beamW, plotH, zeroY, maxVal, unit, colors) {
    ctx.save();

    // Horizontal zero axis
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(this.padding.left, zeroY);
    ctx.lineTo(width - this.padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zero label on Y axis
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`0.0 ${unit}`, this.padding.left - 8, zeroY + 3);

    // +Max and -Max grid lines
    const yTop = this.padding.top;
    const yBottom = height - this.padding.bottom;

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(this.padding.left, yTop);
    ctx.lineTo(width - this.padding.right, yTop);
    ctx.moveTo(this.padding.left, yBottom);
    ctx.lineTo(width - this.padding.right, yBottom);
    ctx.stroke();

    ctx.fillText(`+${maxVal.toFixed(1)} ${unit}`, this.padding.left - 8, yTop + 4);
    ctx.fillText(`-${maxVal.toFixed(1)} ${unit}`, this.padding.left - 8, yBottom + 4);

    // Vertical grid ticks
    const numTicks = Math.min(10, Math.ceil(this.engine.length));
    for (let i = 0; i <= numTicks; i++) {
      const xVal = (i / numTicks) * this.engine.length;
      const px = this.metersToPx(xVal, beamW);

      ctx.beginPath();
      ctx.moveTo(px, this.padding.top);
      ctx.lineTo(px, height - this.padding.bottom);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawMarker(ctx, x, y, color, title, subtitle, colors) {
    ctx.save();
    // Halo
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = colors.cardBg;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Floating tag
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(`${title} (${subtitle})`, x, y - 10);
    ctx.restore();
  }

  drawDiamondMarker(ctx, x, y, color, title, subtitle, colors) {
    ctx.save();
    const d = 5;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(x, y - d);
    ctx.lineTo(x + d, y);
    ctx.lineTo(x, y + d);
    ctx.lineTo(x - d, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(`Inflection (${subtitle})`, x, y + 14);
    ctx.restore();
  }

  drawMomentBadge(ctx, x, y, text, color, colors) {
    ctx.save();
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const tw = ctx.measureText(text).width + 12;
    const th = 18;
    const isUpper = y < (this.padding.top + 50);
    const badgeY = isUpper ? y + 8 : y - th - 8;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.roundRect?.(x - tw / 2, badgeY, tw, th, 4);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, x, badgeY + 12);

    // Pointer dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCrosshairLine(ctx, x, y1, y2, colors) {
    ctx.save();
    ctx.strokeStyle = colors.crosshair;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.shadowColor = colors.crosshairGlow;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    ctx.restore();
  }

  drawCrosshairDot(ctx, x, y, color, colors) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.cardBg;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
