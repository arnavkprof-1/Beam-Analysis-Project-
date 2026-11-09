# Structural Beam Analysis: SFD & BMD Diagnostics Platform

An interactive, production-ready, highly aesthetic Web Application & Dashboard for **Shear Force & Bending Moment Diagnostics** across Simply Supported, Overhanging, and Cantilever Beams.

---

## 🌟 Key Features

### 1. Visual & UI/UX Standards
- **Modern CAD / SaaS Dashboard**: Dark Slate (`#0f172a`) theme with vibrant Indigo (`#6366f1`) and Cyan (`#06b6d4`) glowing accents, plus a crisp Light Mode toggle.
- **Glassmorphic Cards**: Sleek panels with backdrop blur, high-contrast borders, and responsive split-view (Controls on left, Real-time Visualizations & Diagnostics on right).
- **Crisp Typography**: Inter for interface elements and JetBrains Mono for numbers, coordinates, and units.
- **Interactive Badges**: Live equilibrium verification (`∑Fy = 0.00 kN [PASS]`, stress utilization, inflection counts).

### 2. Functional & Analytical Engine
- **Boundary Configurations**:
  - Two-support system: Supports Pin and Roller at arbitrary positions $x_{R1}$ and $x_{R2}$ (Simply Supported, Single Overhang, Double Overhang).
  - Cantilever system: Clamped fixed support at $x=0$ or $x=L$.
- **Dynamic Load Customizer**:
  - Concentrated / Point Loads ($P$ in kN, upward/downward toggle).
  - Uniformly Distributed Loads (UDL, $w$ in kN/m across $[x_1, x_2]$).
  - Applied Concentrated Moments ($M$ in kN·m, clockwise/counter-clockwise).
- **Continuous Section Mechanics (2,000 sampling points)**:
  - Exact discontinuity preservation: Dual sampling $(x^* - \epsilon, x^* + \epsilon)$ at point loads and supports to eliminate diagonal rendering slants.
  - Automatic detection of:
    - Absolute Maximum & Minimum Bending Moments ($M_{\max}$, $M_{\min}$) and coordinates.
    - Maximum Shear Force ($V_{\max}$).
    - Points of Zero Shear ($V = 0$ / peak moment locations) including step-jump crossings.
    - Points of Contraflexure / Inflection ($M = 0$ where curvature reverses).
- **Stress & Section Mechanics**:
  - Elastic Section Modulus $Z$ (Presets for I-Beams, Rectangular $b \times h$, Solid Circular, or Custom $Z$).
  - Allowable Bending Stress ($\sigma_{\text{allow}}$) and Safety Factor calculation ($\sigma = |M_{\max}| / Z$).

### 3. Interactive Visualizations
- **Three Synchronized Crosshair-Linked Canvases**:
  1. **2D Schematic Beam View**: Steel beam silhouette, pin/roller/fixed supports, vector load arrows, hatched UDL spans, circular moment arcs, live reaction vectors.
  2. **Shear Force Diagram (SFD)**: Dual-gradient shaded fills (cyan/indigo for positive, rose/amber for negative), dashed zero-axis, zero-shear glowing indicators.
  3. **Bending Moment Diagram (BMD)**: Shaded sagging (emerald/cyan) and hogging (purple/rose) zones, highlighted inflection points and peak moment badges.
- **Linked Inspector HUD**: Hovering over any canvas scrubs a synchronized crosshair line across all three plots simultaneously, showing $[x, V(x), M(x), \sigma(x)]$.

### 4. Advanced Diagnostics & Exports
- **1-Click Presets**:
  - Standard Double Overhang (UDL + 3 Point Loads)
  - Single Overhang Cantilever Tip Load
  - Simply Supported Center Point Load
  - Simply Supported Full Uniform Load ($wL^2/8$)
  - Symmetric Two-Axle Wheel / Crane Loading
  - Overhanging Beam with Couple Moment & UDL
  - Pure Cantilever with UDL and Tip Moment
- **Data Export**:
  - **Export Report (PDF / Print-friendly view)**: Formatted engineering calculation sheet.
  - **Export CSV**: High-resolution $(x, V, M, \sigma)$ dataset.
  - **Copy LaTeX Equations**: Piece-wise expressions for $V(x)$ and $M(x)$ partitioned across spans.

---

## 🚀 Running the Application

The web application is self-contained and runs on any modern browser:

```bash
# Start local server (already running at http://localhost:8085)
cd beam-analyzer
python -m http.server 8085
```

Open [http://localhost:8085](http://localhost:8085) in your web browser.
