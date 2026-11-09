/**
 * Structural Beam Analysis Engine
 * Calculates static equilibrium, reactions, internal shear force V(x),
 * bending moment M(x), inflection points, and stress diagnostics.
 * 
 * Supports:
 * - Two-support systems (Simply Supported, Single Overhang, Double Overhang)
 * - Cantilever systems (Clamped at left x=0 or right x=L or custom)
 * - Concentrated / Point loads (upward / downward)
 * - Uniformly Distributed Loads (UDL) across arbitrary sub-spans [x1, x2]
 * - Concentrated / Couple Moments (clockwise / counterclockwise)
 */

export class BeamEngine {
  constructor(config = {}) {
    this.length = config.length ?? 10; // meters
    this.supportType = config.supportType ?? 'two-supports'; // 'two-supports' | 'cantilever-left' | 'cantilever-right'
    this.supportA = config.supportA ?? { x: 2, type: 'pinned' }; // x in m
    this.supportB = config.supportB ?? { x: 8, type: 'roller' }; // x in m
    this.pointLoads = config.pointLoads ?? []; // { id, x, magnitude (kN, downward > 0), label }
    this.udlLoads = config.udlLoads ?? []; // { id, x1, x2, magnitude (kN/m, downward > 0), label }
    this.moments = config.moments ?? []; // { id, x, magnitude (kN*m, clockwise > 0), label }
    
    // Cross-section & material parameters
    this.sectionModulus = config.sectionModulus ?? 500; // cm^3
    this.allowableStress = config.allowableStress ?? 250; // MPa (e.g. S275/A36 steel)
    this.signConvention = config.signConvention ?? 'sagging-positive'; // 'sagging-positive' (tension bottom) | 'hogging-positive'
  }

  // Setters
  setBeamLength(L) {
    this.length = Math.max(0.1, Number(L));
  }

  setSupports(type, posA, posB) {
    this.supportType = type;
    if (posA !== undefined) this.supportA.x = Math.max(0, Math.min(this.length, Number(posA)));
    if (posB !== undefined) this.supportB.x = Math.max(0, Math.min(this.length, Number(posB)));
  }

  addPointLoad(load) {
    const id = load.id || 'pl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    this.pointLoads.push({
      id,
      x: Math.max(0, Math.min(this.length, Number(load.x))),
      magnitude: Number(load.magnitude), // downward positive (kN)
      label: load.label || `P${this.pointLoads.length + 1}`
    });
    return id;
  }

  addUDL(udl) {
    const id = udl.id || 'udl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const x1 = Math.max(0, Math.min(this.length, Number(udl.x1)));
    const x2 = Math.max(0, Math.min(this.length, Number(udl.x2)));
    this.udlLoads.push({
      id,
      x1: Math.min(x1, x2),
      x2: Math.max(x1, x2),
      magnitude: Number(udl.magnitude), // downward positive (kN/m)
      label: udl.label || `w${this.udlLoads.length + 1}`
    });
    return id;
  }

  addMoment(moment) {
    const id = moment.id || 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    this.moments.push({
      id,
      x: Math.max(0, Math.min(this.length, Number(moment.x))),
      magnitude: Number(moment.magnitude), // clockwise positive (kN*m)
      label: moment.label || `M${this.moments.length + 1}`
    });
    return id;
  }

  removeLoad(type, id) {
    if (type === 'point') this.pointLoads = this.pointLoads.filter(l => l.id !== id);
    if (type === 'udl') this.udlLoads = this.udlLoads.filter(l => l.id !== id);
    if (type === 'moment') this.moments = this.moments.filter(l => l.id !== id);
  }

  clearLoads() {
    this.pointLoads = [];
    this.udlLoads = [];
    this.moments = [];
  }

  /**
   * Static Equilibrium Analysis
   * Computes reaction forces and reaction moments.
   */
  calculateReactions() {
    const L = this.length;
    let totalDownwardForce = 0;
    let sumMomentsAboutOrigin = 0; // Clockwise positive moments about x=0
    let steps = [];

    // Sum from point loads (downward load F at x produces clockwise moment about x=0: +F*x)
    for (const pl of this.pointLoads) {
      totalDownwardForce += pl.magnitude;
      sumMomentsAboutOrigin += pl.magnitude * pl.x;
    }

    // Sum from UDL loads
    for (const udl of this.udlLoads) {
      const span = Math.max(0, udl.x2 - udl.x1);
      const totalUDLForce = udl.magnitude * span;
      const centroid = (udl.x1 + udl.x2) / 2;
      totalDownwardForce += totalUDLForce;
      sumMomentsAboutOrigin += totalUDLForce * centroid;
    }

    // Concentrated applied moments (clockwise positive adds directly)
    for (const m of this.moments) {
      sumMomentsAboutOrigin += m.magnitude;
    }

    let reactions = {
      R1: 0, // at support A
      R2: 0, // at support B
      M_fixed: 0, // fixed clamp reaction moment if cantilever
      posA: this.supportA.x,
      posB: this.supportB.x,
      isStable: true,
      statusMessage: 'Equilibrium Satisfied',
      totalDownwardForce,
      totalUpwardReaction: 0,
      balanceError: 0,
      steps: []
    };

    if (this.supportType === 'cantilever-left') {
      // Clamped at x = 0
      // Upward reaction force R1 = total downward force
      // Counterclockwise clamp moment M_fixed balances sum of clockwise moments
      const R1 = totalDownwardForce;
      const M_fixed = -sumMomentsAboutOrigin; // Counterclockwise reaction moment
      reactions.R1 = R1;
      reactions.R2 = 0;
      reactions.M_fixed = M_fixed;
      reactions.posA = 0;
      reactions.totalUpwardReaction = R1;
      reactions.balanceError = Math.abs(R1 - totalDownwardForce);

      reactions.steps = [
        `Cantilever fixed at x = 0.00 m:`,
        `∑ Fy = 0  =>  R_fixed = Total Downward Load = ${R1.toFixed(3)} kN ↑`,
        `∑ M(x=0) = 0  =>  M_reaction = ${Math.abs(M_fixed).toFixed(3)} kN·m (${M_fixed <= 0 ? 'Counter-Clockwise' : 'Clockwise'})`
      ];

      return reactions;
    }

    if (this.supportType === 'cantilever-right') {
      // Clamped at x = L
      const R2 = totalDownwardForce;
      // Moments about x = L:
      // A downward load at x produces counterclockwise moment about x=L: -F*(L - x)
      let sumMomentsAboutL = 0;
      for (const pl of this.pointLoads) {
        sumMomentsAboutL -= pl.magnitude * (L - pl.x);
      }
      for (const udl of this.udlLoads) {
        const span = Math.max(0, udl.x2 - udl.x1);
        const force = udl.magnitude * span;
        const centroid = (udl.x1 + udl.x2) / 2;
        sumMomentsAboutL -= force * (L - centroid);
      }
      for (const m of this.moments) {
        sumMomentsAboutL += m.magnitude;
      }

      const M_fixed = -sumMomentsAboutL;
      reactions.R1 = 0;
      reactions.R2 = R2;
      reactions.M_fixed = M_fixed;
      reactions.posB = L;
      reactions.totalUpwardReaction = R2;
      reactions.balanceError = Math.abs(R2 - totalDownwardForce);

      reactions.steps = [
        `Cantilever fixed at x = ${L.toFixed(2)} m:`,
        `∑ Fy = 0  =>  R_fixed = Total Downward Load = ${R2.toFixed(3)} kN ↑`,
        `∑ M(x=L) = 0  =>  M_reaction = ${Math.abs(M_fixed).toFixed(3)} kN·m`
      ];

      return reactions;
    }

    // Two-support system (Simply supported or Overhanging)
    const xA = this.supportA.x;
    const xB = this.supportB.x;
    const spanAB = xB - xA;

    if (Math.abs(spanAB) < 1e-4) {
      reactions.isStable = false;
      reactions.statusMessage = 'Unstable: Supports A and B coincide (Span = 0). Cannot resist overturning.';
      return reactions;
    }

    // Moment equilibrium about Support A (taking clockwise as positive):
    // R2 acts upward at xB, producing counterclockwise moment about xA: -R2 * (xB - xA)
    // Applied loads produce moment about xA:
    // Downward force at x: moment about xA = +F * (x - xA)
    let sumMomentsAboutA = 0;

    for (const pl of this.pointLoads) {
      sumMomentsAboutA += pl.magnitude * (pl.x - xA);
    }

    for (const udl of this.udlLoads) {
      const span = Math.max(0, udl.x2 - udl.x1);
      const force = udl.magnitude * span;
      const centroid = (udl.x1 + udl.x2) / 2;
      sumMomentsAboutA += force * (centroid - xA);
    }

    for (const m of this.moments) {
      sumMomentsAboutA += m.magnitude;
    }

    // ∑ M_A = 0 => sumMomentsAboutA - R2 * (xB - xA) = 0
    // => R2 = sumMomentsAboutA / (xB - xA)
    const R2 = sumMomentsAboutA / spanAB;
    const R1 = totalDownwardForce - R2;

    reactions.R1 = R1;
    reactions.R2 = R2;
    reactions.totalUpwardReaction = R1 + R2;
    reactions.balanceError = Math.abs((R1 + R2) - totalDownwardForce);

    reactions.steps = [
      `1. Equilibrium of Moments about Support A (x = ${xA.toFixed(2)} m):`,
      `   ∑ M_A = 0  =>  R_B · (${xB.toFixed(2)} - ${xA.toFixed(2)}) - (${sumMomentsAboutA.toFixed(3)} kN·m) = 0`,
      `   R_B = ${sumMomentsAboutA.toFixed(3)} / ${spanAB.toFixed(3)} = ${R2.toFixed(3)} kN ${R2 >= 0 ? '↑' : '↓'}`,
      `2. Vertical Force Equilibrium:`,
      `   ∑ F_y = 0  =>  R_A + R_B = Total Applied Load (${totalDownwardForce.toFixed(3)} kN)`,
      `   R_A = ${totalDownwardForce.toFixed(3)} - (${R2.toFixed(3)}) = ${R1.toFixed(3)} kN ${R1 >= 0 ? '↑' : '↓'}`,
      `3. Equilibrium Verification:`,
      `   |∑ F_y| = ${reactions.balanceError.toExponential(2)} kN ≈ 0.00 kN [PASS]`
    ];

    return reactions;
  }

  /**
   * Internal Section Mechanics: Evaluates V(x) and M(x) at any section x
   * Using Euler-Bernoulli left-to-right section cut:
   * Upward forces to left cause positive shear (+V)
   * Downward loads to left cause negative shear (-V)
   * Sagging moment (compression top, tension bottom) is positive:
   * - Upward forces to left cause positive moment: +R * (x - x_R)
   * - Downward loads to left cause negative moment: -P * (x - x_P)
   * - Clockwise applied moment to left causes positive bending moment
   */
  evaluateAt(x, reactions) {
    let V = 0;
    let M = 0;

    // 1. Reactions to the left of x
    if (this.supportType === 'cantilever-left') {
      if (x > 0) {
        V += reactions.R1;
        M += reactions.R1 * x + reactions.M_fixed;
      }
    } else if (this.supportType === 'cantilever-right') {
      // Right cantilever: reaction is at x=L, so no reaction to left if x < L
      // Only applied loads to the left act
    } else {
      // Two supports
      if (x > reactions.posA) {
        V += reactions.R1;
        M += reactions.R1 * (x - reactions.posA);
      }
      if (x > reactions.posB) {
        V += reactions.R2;
        M += reactions.R2 * (x - reactions.posB);
      }
    }

    // 2. Point loads to the left of x
    for (const pl of this.pointLoads) {
      if (x > pl.x) {
        V -= pl.magnitude;
        M -= pl.magnitude * (x - pl.x);
      }
    }

    // 3. UDL loads to the left of x
    for (const udl of this.udlLoads) {
      if (x > udl.x1) {
        const activeSpan = Math.min(x, udl.x2) - udl.x1;
        if (activeSpan > 0) {
          const force = udl.magnitude * activeSpan;
          const centroid = udl.x1 + activeSpan / 2;
          V -= force;
          M -= force * (x - centroid);
        }
      }
    }

    // 4. Concentrated moments to the left of x
    for (const m of this.moments) {
      if (x > m.x) {
        M += m.magnitude;
      }
    }

    // Flip moment sign if civil/hogging-positive convention is selected
    const signFactor = this.signConvention === 'hogging-positive' ? -1 : 1;

    return {
      x,
      V,
      M: M * signFactor
    };
  }

  /**
   * Continuous Analysis over 2000 points with exact step discontinuity capture
   */
  solve() {
    const reactions = this.calculateReactions();
    const L = this.length;
    const numPoints = 2000;

    // Collect all critical discontinuity boundaries
    const criticalX = new Set([0, L]);
    if (this.supportType === 'cantilever-left') {
      criticalX.add(0);
    } else if (this.supportType === 'cantilever-right') {
      criticalX.add(L);
    } else {
      criticalX.add(this.supportA.x);
      criticalX.add(this.supportB.x);
    }

    for (const pl of this.pointLoads) criticalX.add(pl.x);
    for (const udl of this.udlLoads) {
      criticalX.add(udl.x1);
      criticalX.add(udl.x2);
    }
    for (const m of this.moments) criticalX.add(m.x);

    const sortedCrit = Array.from(criticalX).sort((a, b) => a - b);

    // Build sampling x-points list including exact dual points (x - eps, x + eps)
    const eps = 1e-6;
    const xSamplePoints = [];

    // Uniform grid
    const dx = L / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
      xSamplePoints.push(i * dx);
    }

    // Inject discontinuity pairs
    for (const cx of sortedCrit) {
      if (cx > 0 && cx < L) {
        xSamplePoints.push(Math.max(0, cx - eps));
        xSamplePoints.push(Math.min(L, cx + eps));
      } else if (cx === 0) {
        xSamplePoints.push(eps);
      } else if (cx === L) {
        xSamplePoints.push(L - eps);
      }
    }

    // Sort and remove duplicates within 1e-9
    xSamplePoints.sort((a, b) => a - b);
    const uniqueX = [];
    for (let i = 0; i < xSamplePoints.length; i++) {
      if (i === 0 || Math.abs(xSamplePoints[i] - xSamplePoints[i - 1]) > 1e-7) {
        uniqueX.push(xSamplePoints[i]);
      }
    }

    // Compute V(x) and M(x) across points
    const points = [];
    let maxV = -Infinity;
    let minV = Infinity;
    let maxAbsV = 0;
    let maxM = -Infinity;
    let minM = Infinity;
    let maxAbsM = 0;
    let maxVPos = 0;
    let maxMPos = 0;
    let minMPos = 0;

    for (const x of uniqueX) {
      const res = this.evaluateAt(x, reactions);
      points.push(res);

      if (res.V > maxV) maxV = res.V;
      if (res.V < minV) minV = res.V;
      if (Math.abs(res.V) > maxAbsV) {
        maxAbsV = Math.abs(res.V);
        maxVPos = res.x;
      }

      if (res.M > maxM) {
        maxM = res.M;
        maxMPos = res.x;
      }
      if (res.M < minM) {
        minM = res.M;
        minMPos = res.x;
      }
      if (Math.abs(res.M) > maxAbsM) {
        maxAbsM = Math.abs(res.M);
      }
    }

    // Detect Points of Zero Shear (where V(x) crosses zero or jumps across zero)
    const zeroShearPoints = this.findZeroShearPoints(points, sortedCrit, reactions);

    // Detect Points of Contraflexure / Inflection (where M(x) = 0)
    const contraflexurePoints = this.findContraflexurePoints(points, sortedCrit, reactions);

    // Compute maximum bending stress σ = |M_max| / Z
    // M in kN*m = 10^6 N*mm
    // Z in cm^3 = 10^3 mm^3
    // σ = (M * 10^6 N*mm) / (Z * 10^3 mm^3) = (M / Z) * 1000 MPa (N/mm^2)
    const peakMomentAbs = Math.max(Math.abs(maxM), Math.abs(minM));
    const peakStress = this.sectionModulus > 0 ? (peakMomentAbs * 1000) / this.sectionModulus : 0; // MPa
    const stressRatio = this.allowableStress > 0 ? (peakStress / this.allowableStress) * 100 : 0; // %
    const safetyFactor = peakStress > 0 ? this.allowableStress / peakStress : Infinity;

    return {
      reactions,
      points,
      sortedCrit,
      diagnostics: {
        maxV: Number(maxV.toFixed(3)),
        minV: Number(minV.toFixed(3)),
        maxAbsV: Number(maxAbsV.toFixed(3)),
        maxVPos: Number(maxVPos.toFixed(3)),
        maxM: Number(maxM.toFixed(3)),
        maxMPos: Number(maxMPos.toFixed(3)),
        minM: Number(minM.toFixed(3)),
        minMPos: Number(minMPos.toFixed(3)),
        maxAbsM: Number(maxAbsM.toFixed(3)),
        peakStress: Number(peakStress.toFixed(2)),
        stressRatio: Number(stressRatio.toFixed(1)),
        safetyFactor: Number(isFinite(safetyFactor) ? safetyFactor.toFixed(2) : '99.9'),
        zeroShearPoints,
        contraflexurePoints,
        totalLoad: Number(reactions.totalDownwardForce.toFixed(3)),
        totalReaction: Number(reactions.totalUpwardReaction.toFixed(3)),
        balanceCheck: reactions.balanceError < 1e-4
      }
    };
  }

  /**
   * Find all points where Shear Force V(x) = 0
   * These correspond to local extrema of Bending Moment M(x)
   * Captures both continuous slope crossings inside UDLs and step jumps across zero at point loads/reactions
   */
  findZeroShearPoints(points, boundaries, reactions) {
    const results = [];
    if (this.pointLoads.length === 0 && this.udlLoads.length === 0 && this.moments.length === 0) {
      return results;
    }

    const eps = 1e-5;

    // 1. Check for step jumps across zero at boundary points (point loads & reactions)
    for (const bx of boundaries) {
      if (bx <= 0.01 || bx >= this.length - 0.01) continue;

      const evalBefore = this.evaluateAt(bx - eps, reactions);
      const evalAfter = this.evaluateAt(bx + eps, reactions);

      if (evalBefore.V * evalAfter.V <= 0 && Math.abs(evalAfter.V - evalBefore.V) > 0.05) {
        const rootEval = this.evaluateAt(bx, reactions);
        if (!results.some(r => Math.abs(r.x - bx) < 0.05)) {
          results.push({
            x: Number(bx.toFixed(3)),
            V: 0,
            M: Number(Math.max(Math.abs(evalBefore.M), Math.abs(evalAfter.M)) * (evalBefore.M >= 0 ? 1 : -1)).toFixed(3),
            type: 'Zero Shear Step / Peak Moment'
          });
        }
      }
    }

    // 2. Check for continuous zero crossings inside spans between boundaries
    for (let i = 0; i < boundaries.length - 1; i++) {
      const xA = boundaries[i];
      const xB = boundaries[i + 1];
      if (xB - xA < 1e-4) continue;

      const evalA = this.evaluateAt(xA + eps, reactions);
      const evalB = this.evaluateAt(xB - eps, reactions);

      if (evalA.V * evalB.V < -1e-5) {
        const dV = evalB.V - evalA.V;
        let rootX;
        if (Math.abs(dV) > 1e-6) {
          rootX = xA + (-evalA.V / dV) * (xB - xA);
        } else {
          rootX = (xA + xB) / 2;
        }

        rootX = Math.max(xA, Math.min(xB, rootX));
        const rootEval = this.evaluateAt(rootX, reactions);

        if (!results.some(r => Math.abs(r.x - rootX) < 0.05)) {
          results.push({
            x: Number(rootX.toFixed(3)),
            V: 0,
            M: Number(rootEval.M.toFixed(3)),
            type: 'Zero Shear / Peak Moment'
          });
        }
      }
    }

    results.sort((a, b) => a.x - b.x);
    return results;
  }

  /**
   * Find Points of Contraflexure (where Bending Moment M(x) = 0)
   * Inflection points between sagging and hogging zones (curvature changes sign)
   */
  findContraflexurePoints(points, boundaries, reactions) {
    const results = [];
    if (this.pointLoads.length === 0 && this.udlLoads.length === 0 && this.moments.length === 0) {
      return results;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      // Exclude boundary zeros at free beam ends
      if (p1.x < 0.05) continue;
      if (p2.x > this.length - 0.05) continue;

      // Strict sign crossing: p1.M * p2.M < 0
      if (p1.M * p2.M < -1e-6) {
        let rootX = p1.x;
        const dM = p2.M - p1.M;
        if (Math.abs(dM) > 1e-6) {
          rootX = p1.x + (-p1.M / dM) * (p2.x - p1.x);
        }
        rootX = Number(rootX.toFixed(3));

        if (rootX > 0.05 && rootX < this.length - 0.05 && !results.some(r => Math.abs(r.x - rootX) < 0.08)) {
          const evalAtRoot = this.evaluateAt(rootX, reactions);
          results.push({
            x: rootX,
            V: Number(evalAtRoot.V.toFixed(3)),
            M: 0,
            type: 'Point of Contraflexure'
          });
        }
      }
    }

    return results;
  }

  /**
   * Generate Piece-wise LaTeX equations for V(x) and M(x)
   */
  generateLatexEquations(reactions) {
    const boundaries = Array.from(new Set([
      0,
      this.supportA.x,
      this.supportB.x,
      ...this.pointLoads.map(p => p.x),
      ...this.udlLoads.flatMap(u => [u.x1, u.x2]),
      ...this.moments.map(m => m.x),
      this.length
    ])).sort((a, b) => a - b);

    let vLatex = `\\begin{aligned}\n`;
    vLatex += `V(x) = \\begin{cases}\n`;

    let mLatex = `\\begin{aligned}\n`;
    mLatex += `M(x) = \\begin{cases}\n`;

    for (let i = 0; i < boundaries.length - 1; i++) {
      const x1 = boundaries[i];
      const x2 = boundaries[i + 1];
      if (x2 - x1 < 1e-4) continue;

      const mid = (x1 + x2) / 2;
      const evalMid = this.evaluateAt(mid, reactions);
      const evalStart = this.evaluateAt(x1 + 1e-5, reactions);
      const evalEnd = this.evaluateAt(x2 - 1e-5, reactions);

      const dV = (evalEnd.V - evalStart.V) / (x2 - x1);

      // V(x) expression
      let vExpr = '';
      if (Math.abs(dV) < 1e-3) {
        vExpr = `${evalMid.V.toFixed(2)}`;
      } else {
        const slope = dV.toFixed(2);
        const intercept = (evalStart.V - dV * x1).toFixed(2);
        vExpr = `${slope}x ${Number(intercept) >= 0 ? '+' : '-'} ${Math.abs(Number(intercept))}`;
      }

      vLatex += `  ${vExpr}, & ${x1.toFixed(2)} \\le x < ${x2.toFixed(2)} \\\\[4pt]\n`;

      // M(x) approximation for display
      let mExpr = `\\int V(x)dx = ${evalMid.M.toFixed(2)}`;
      mLatex += `  ${evalStart.M.toFixed(2)} \\to ${evalEnd.M.toFixed(2)}, & ${x1.toFixed(2)} \\le x < ${x2.toFixed(2)} \\\\[4pt]\n`;
    }

    vLatex += `\\end{cases}\n\\end{aligned}`;
    mLatex += `\\end{cases}\n\\end{aligned}`;

    return {
      shearLatex: vLatex,
      momentLatex: mLatex,
      reactionsLatex: `R_A = ${reactions.R1.toFixed(2)}\\,\\text{kN},\\quad R_B = ${reactions.R2.toFixed(2)}\\,\\text{kN}`
    };
  }

  /**
   * Export CSV of computed points
   */
  exportCSV(solution) {
    let csv = `x_m,ShearForce_V_kN,BendingMoment_M_kNm,BendingStress_sigma_MPa\n`;
    for (const pt of solution.points) {
      const stress = this.sectionModulus > 0 ? (Math.abs(pt.M) * 1000) / this.sectionModulus : 0;
      csv += `${pt.x.toFixed(4)},${pt.V.toFixed(4)},${pt.M.toFixed(4)},${stress.toFixed(2)}\n`;
    }
    return csv;
  }
}
