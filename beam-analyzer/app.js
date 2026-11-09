/**
 * Main Application Controller for Structural Beam Analysis Dashboard
 */

import { BeamEngine } from './beam-engine.js';
import { BeamRenderer } from './beam-renderer.js';
import { BEAM_PRESETS } from './presets.js';

class BeamApp {
  constructor() {
    this.engine = new BeamEngine({
      length: 12,
      supportType: 'two-supports',
      supportA: { x: 2, type: 'pinned' },
      supportB: { x: 10, type: 'roller' },
      pointLoads: [
        { id: 'pl_1', x: 0, magnitude: 20, label: 'Tip Load A' },
        { id: 'pl_2', x: 6, magnitude: 40, label: 'Midspan Load' },
        { id: 'pl_3', x: 12, magnitude: 25, label: 'Tip Load B' }
      ],
      udlLoads: [
        { id: 'udl_1', x1: 2, x2: 10, magnitude: 15, label: 'Main Span UDL' }
      ],
      moments: [],
      sectionModulus: 500,
      allowableStress: 250,
      signConvention: 'sagging-positive'
    });

    this.activeTab = 'all';
    this.isDarkMode = true;
    this.currentSolution = null;

    this.initDOM();
    this.initRenderer();
    this.initEventListeners();
    this.loadPresetsList();
    this.update();
  }

  initDOM() {
    // Elements Cache
    this.dom = {
      // Inputs
      sliderLength: document.getElementById('slider-length'),
      numLength: document.getElementById('num-length'),
      valLength: document.getElementById('val-length'),
      selectSupportSystem: document.getElementById('select-support-system'),
      twoSupportsControls: document.getElementById('two-supports-controls'),
      sliderSupportA: document.getElementById('slider-support-a'),
      numSupportA: document.getElementById('num-support-a'),
      valSupportA: document.getElementById('val-support-a'),
      sliderSupportB: document.getElementById('slider-support-b'),
      numSupportB: document.getElementById('num-support-b'),
      valSupportB: document.getElementById('val-support-b'),
      overhangLeftPill: document.getElementById('overhang-left-pill'),
      overhangRightPill: document.getElementById('overhang-right-pill'),
      spanInfoBadge: document.getElementById('span-info-badge'),

      // Stress & Section
      selectProfileType: document.getElementById('select-profile-type'),
      rectInputs: document.getElementById('rect-inputs'),
      rectB: document.getElementById('rect-b'),
      rectH: document.getElementById('rect-h'),
      sliderSectionModulus: document.getElementById('slider-section-modulus'),
      numSectionModulus: document.getElementById('num-section-modulus'),
      valSectionModulus: document.getElementById('val-section-modulus'),
      selectMaterial: document.getElementById('select-material'),
      sliderAllowableStress: document.getElementById('slider-allowable-stress'),
      numAllowableStress: document.getElementById('num-allowable-stress'),
      valAllowableStress: document.getElementById('val-allowable-stress'),
      stressBadge: document.getElementById('stress-badge'),

      // Loads
      loadsContainer: document.getElementById('loads-container'),
      countAll: document.getElementById('count-all'),
      countPoint: document.getElementById('count-point'),
      countUDL: document.getElementById('count-udl'),
      countMoment: document.getElementById('count-moment'),

      // Metrics
      equilibriumBadge: document.getElementById('equilibrium-badge'),
      metricEquilibrium: document.getElementById('metric-equilibrium'),
      metricLoadSum: document.getElementById('metric-load-sum'),
      metricReactions: document.getElementById('metric-reactions'),
      metricReactionsSub: document.getElementById('metric-reactions-sub'),
      metricMaxMoment: document.getElementById('metric-max-moment'),
      metricMomentPos: document.getElementById('metric-moment-pos'),
      metricMaxShear: document.getElementById('metric-max-shear'),
      metricShearPos: document.getElementById('metric-shear-pos'),
      metricStress: document.getElementById('metric-stress'),
      metricSafetyFactor: document.getElementById('metric-safety-factor'),
      schematicBadge: document.getElementById('schematic-badge'),
      zeroShearBadge: document.getElementById('zero-shear-badge'),
      contraflexureBadge: document.getElementById('contraflexure-badge'),

      // Diagnostics Tables & Math
      equilibriumStepsContent: document.getElementById('equilibrium-steps-content'),
      criticalPointsTableBody: document.getElementById('critical-points-table-body'),
      critPointsCount: document.getElementById('crit-points-count'),

      // HUD
      crosshairHud: document.getElementById('crosshair-hud'),
      hudX: document.getElementById('hud-x'),
      hudV: document.getElementById('hud-v'),
      hudM: document.getElementById('hud-m'),
      hudStress: document.getElementById('hud-stress'),
      hudStatus: document.getElementById('hud-status'),

      // Modals
      modalAddLoad: document.getElementById('modal-add-load'),
      modalPresets: document.getElementById('modal-presets'),
      modalLatex: document.getElementById('modal-latex'),

      // Add Load Modal fields
      modalLoadType: document.getElementById('modal-load-type'),
      modalFieldsPoint: document.getElementById('modal-fields-point'),
      modalFieldsUDL: document.getElementById('modal-fields-udl'),
      modalFieldsMoment: document.getElementById('modal-fields-moment'),
      modalPlX: document.getElementById('modal-pl-x'),
      modalPlMag: document.getElementById('modal-pl-mag'),
      modalPlDir: document.getElementById('modal-pl-dir'),
      modalUdlX1: document.getElementById('modal-udl-x1'),
      modalUdlX2: document.getElementById('modal-udl-x2'),
      modalUdlMag: document.getElementById('modal-udl-mag'),
      modalMomentX: document.getElementById('modal-moment-x'),
      modalMomentMag: document.getElementById('modal-moment-mag'),
      modalMomentDir: document.getElementById('modal-moment-dir'),

      // Buttons & Actions
      btnGenerateDiagrams: document.getElementById('btn-generate-diagrams'),
      btnHeaderGenerate: document.getElementById('btn-header-generate'),
      btnCalculateLoads: document.getElementById('btn-calculate-loads'),
      btnQuickAdd: document.getElementById('btn-quick-add'),
      quickLoadType: document.getElementById('quick-load-type'),
      quickLoadX: document.getElementById('quick-load-x'),
      quickLoadMag: document.getElementById('quick-load-mag'),
      toastNotification: document.getElementById('toast-notification'),
      toastMsg: document.getElementById('toast-msg'),

      btnTheme: document.getElementById('btn-theme'),
      themeIcon: document.getElementById('theme-icon'),
      btnConvention: document.getElementById('btn-convention'),
      btnPresets: document.getElementById('btn-presets'),
      btnLatex: document.getElementById('btn-latex'),
      btnExportCsv: document.getElementById('btn-export-csv'),
      btnExportPrint: document.getElementById('btn-export-print'),
      btnAddLoadModal: document.getElementById('btn-add-load-modal'),
      btnSaveNewLoad: document.getElementById('btn-save-new-load'),
      btnCopyLatex: document.getElementById('btn-copy-latex'),
      presetsListContainer: document.getElementById('presets-list-container')
    };
  }

  initRenderer() {
    const canvases = {
      beam: document.getElementById('canvas-beam'),
      sfd: document.getElementById('canvas-sfd'),
      bmd: document.getElementById('canvas-bmd')
    };

    this.renderer = new BeamRenderer(canvases, { isDarkMode: this.isDarkMode });

    // Synchronized crosshair HUD callback
    this.renderer.onInspect((x, clientX, clientY) => {
      if (x === null) {
        this.dom.crosshairHud.style.display = 'none';
        return;
      }

      this.dom.crosshairHud.style.display = 'flex';
      if (clientX !== undefined && clientY !== undefined) {
        this.dom.crosshairHud.style.left = `${clientX}px`;
        this.dom.crosshairHud.style.top = `${clientY}px`;
      }

      const val = this.engine.evaluateAt(x, this.currentSolution.reactions);
      this.dom.hudX.textContent = `${x.toFixed(2)} m`;
      this.dom.hudV.textContent = `${val.V.toFixed(2)} kN`;
      this.dom.hudM.textContent = `${val.M.toFixed(2)} kN·m`;

      const stress = this.engine.sectionModulus > 0 ? (Math.abs(val.M) * 1000) / this.engine.sectionModulus : 0;
      this.dom.hudStress.textContent = `${stress.toFixed(1)} MPa`;

      // Status text
      let status = 'Span Section';
      if (Math.abs(x - this.engine.supportA.x) < 0.1 && this.engine.supportType === 'two-supports') status = 'Support A (Pin)';
      else if (Math.abs(x - this.engine.supportB.x) < 0.1 && this.engine.supportType === 'two-supports') status = 'Support B (Roller)';
      else if (x < this.engine.supportA.x && this.engine.supportType === 'two-supports') status = 'Left Overhang';
      else if (x > this.engine.supportB.x && this.engine.supportType === 'two-supports') status = 'Right Overhang';
      else if (this.engine.pointLoads.some(p => Math.abs(p.x - x) < 0.1)) status = 'Point Load Section';
      else if (this.engine.udlLoads.some(u => x >= u.x1 && x <= u.x2)) status = 'Under Distributed Load';

      this.dom.hudStatus.textContent = status;
    });

    window.addEventListener('resize', () => {
      this.render();
    });
  }

  initEventListeners() {
    // 1. Beam Length
    const updateLength = (val) => {
      const L = Math.max(1, Number(val));
      this.engine.setBeamLength(L);
      this.dom.valLength.textContent = `${L.toFixed(2)} m`;
      this.dom.sliderLength.value = L;
      this.dom.numLength.value = L;

      // Update max slider limits for supports
      this.dom.sliderSupportA.max = L;
      this.dom.sliderSupportB.max = L;
      this.dom.numSupportA.max = L;
      this.dom.numSupportB.max = L;

      // Clamp existing supports inside length
      if (this.engine.supportA.x > L) this.engine.supportA.x = Math.max(0, L - 1);
      if (this.engine.supportB.x > L) this.engine.supportB.x = L;

      this.syncSupportInputs();
      this.update();
    };

    this.dom.sliderLength.addEventListener('input', (e) => updateLength(e.target.value));
    this.dom.numLength.addEventListener('change', (e) => updateLength(e.target.value));

    // 2. Support Type Selector
    this.dom.selectSupportSystem.addEventListener('change', (e) => {
      const type = e.target.value;
      this.engine.supportType = type;
      if (type === 'two-supports') {
        this.dom.twoSupportsControls.style.display = 'block';
      } else {
        this.dom.twoSupportsControls.style.display = 'none';
      }
      this.update();
    });

    // 3. Support A Position
    const updateSupportA = (val) => {
      const posA = Math.max(0, Math.min(this.engine.length, Number(val)));
      this.engine.supportA.x = posA;
      this.dom.valSupportA.textContent = `${posA.toFixed(2)} m`;
      this.dom.sliderSupportA.value = posA;
      this.dom.numSupportA.value = posA;
      this.update();
    };

    this.dom.sliderSupportA.addEventListener('input', (e) => updateSupportA(e.target.value));
    this.dom.numSupportA.addEventListener('change', (e) => updateSupportA(e.target.value));

    // 4. Support B Position
    const updateSupportB = (val) => {
      const posB = Math.max(0, Math.min(this.engine.length, Number(val)));
      this.engine.supportB.x = posB;
      this.dom.valSupportB.textContent = `${posB.toFixed(2)} m`;
      this.dom.sliderSupportB.value = posB;
      this.dom.numSupportB.value = posB;
      this.update();
    };

    this.dom.sliderSupportB.addEventListener('input', (e) => updateSupportB(e.target.value));
    this.dom.numSupportB.addEventListener('change', (e) => updateSupportB(e.target.value));

    // 5. Section Modulus Z
    const updateZ = (val) => {
      const z = Math.max(1, Number(val));
      this.engine.sectionModulus = z;
      this.dom.valSectionModulus.textContent = `${z} cm³`;
      this.dom.sliderSectionModulus.value = z;
      this.dom.numSectionModulus.value = z;
      this.update();
    };

    this.dom.sliderSectionModulus.addEventListener('input', (e) => updateZ(e.target.value));
    this.dom.numSectionModulus.addEventListener('change', (e) => updateZ(e.target.value));

    // 6. Section Profile Type Calculator
    this.dom.selectProfileType.addEventListener('change', (e) => {
      const type = e.target.value;
      if (type === 'rect') {
        this.dom.rectInputs.style.display = 'block';
        this.calcRectZ();
      } else if (type === 'i-beam') {
        this.dom.rectInputs.style.display = 'none';
        updateZ(557); // IPE 300 W_el = 557 cm^3
      } else if (type === 'circle') {
        this.dom.rectInputs.style.display = 'none';
        // Solid round d = 200mm => Z = pi*d^3/32 = 785 cm^3
        updateZ(785);
      } else {
        this.dom.rectInputs.style.display = 'none';
      }
    });

    this.dom.rectB.addEventListener('input', () => this.calcRectZ());
    this.dom.rectH.addEventListener('input', () => this.calcRectZ());

    // 7. Allowable Stress & Material
    const updateAllowableStress = (val) => {
      const s = Math.max(1, Number(val));
      this.engine.allowableStress = s;
      this.dom.valAllowableStress.textContent = `${s} MPa`;
      this.dom.sliderAllowableStress.value = s;
      this.dom.numAllowableStress.value = s;
      this.update();
    };

    this.dom.sliderAllowableStress.addEventListener('input', (e) => updateAllowableStress(e.target.value));
    this.dom.numAllowableStress.addEventListener('change', (e) => updateAllowableStress(e.target.value));

    this.dom.selectMaterial.addEventListener('change', (e) => {
      if (e.target.value !== 'custom') {
        updateAllowableStress(Number(e.target.value));
      }
    });

    // 8. Sign Convention Toggle
    this.dom.btnConvention.addEventListener('click', () => {
      if (this.engine.signConvention === 'sagging-positive') {
        this.engine.signConvention = 'hogging-positive';
        this.dom.btnConvention.innerHTML = `<i data-lucide="sliders"></i> Hogging +`;
      } else {
        this.engine.signConvention = 'sagging-positive';
        this.dom.btnConvention.innerHTML = `<i data-lucide="sliders"></i> Sagging +`;
      }
      lucide?.createIcons();
      this.update();
    });

    // 9. Load Filter Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        this.renderLoadList();
      });
    });

    // 10. Modals Management
    this.dom.btnAddLoadModal.addEventListener('click', () => {
      this.openModal(this.dom.modalAddLoad);
    });

    this.dom.btnPresets.addEventListener('click', () => {
      this.openModal(this.dom.modalPresets);
    });

    this.dom.btnLatex.addEventListener('click', () => {
      this.showLatexModal();
    });

    // Close buttons on all modals
    document.querySelectorAll('.btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Add Load Type Switcher in modal
    this.dom.modalLoadType.addEventListener('change', (e) => {
      const type = e.target.value;
      this.dom.modalFieldsPoint.style.display = type === 'point' ? 'block' : 'none';
      this.dom.modalFieldsUDL.style.display = type === 'udl' ? 'block' : 'none';
      this.dom.modalFieldsMoment.style.display = type === 'moment' ? 'block' : 'none';
    });

    // Save New Load
    this.dom.btnSaveNewLoad.addEventListener('click', () => {
      this.saveLoadFromModal();
    });

    // Copy LaTeX
    this.dom.btnCopyLatex.addEventListener('click', () => {
      if (this.currentLatex) {
        const text = `% Structural Beam Analysis LaTeX Expressions\n% Reactions:\n${this.currentLatex.reactionsLatex}\n\n% Shear Force V(x):\n${this.currentLatex.shearLatex}\n\n% Bending Moment M(x):\n${this.currentLatex.momentLatex}`;
        navigator.clipboard.writeText(text).then(() => {
          this.dom.btnCopyLatex.innerHTML = `<i data-lucide="check"></i> Copied!`;
          lucide?.createIcons();
          setTimeout(() => {
            this.dom.btnCopyLatex.innerHTML = `<i data-lucide="copy"></i> Copy LaTeX`;
            lucide?.createIcons();
          }, 2000);
        });
      }
    });

    // Export CSV
    this.dom.btnExportCsv.addEventListener('click', () => {
      this.exportCSV();
    });

    // Export PDF / Print
    this.dom.btnExportPrint.addEventListener('click', () => {
      document.getElementById('print-timestamp').textContent = `Generated on: ${new Date().toLocaleString()} | Beam Length: ${this.engine.length}m`;
      window.print();
    });

    // Theme Toggle
    this.dom.btnTheme.addEventListener('click', () => {
      this.isDarkMode = !this.isDarkMode;
      document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
      this.dom.themeIcon.setAttribute('data-lucide', this.isDarkMode ? 'moon' : 'sun');
      this.renderer.setTheme(this.isDarkMode);
      lucide?.createIcons();
      this.render();
    });

    // 11. Explicit "Generate SFD & BMD" Buttons
    // Main Hero CTA button
    this.dom.btnGenerateDiagrams?.addEventListener('click', () => {
      this.generateSFDandBMD('hero-button');
    });

    // Header CTA button
    this.dom.btnHeaderGenerate?.addEventListener('click', () => {
      this.generateSFDandBMD('header-button');
    });

    // Card CTA button
    this.dom.btnCalculateLoads?.addEventListener('click', () => {
      this.generateSFDandBMD('card-button');
    });

    // Quick Add Button
    this.dom.btnQuickAdd?.addEventListener('click', () => {
      this.addQuickLoad();
    });

    // Keyboard Shortcut: Pressing 'Enter' triggers generation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !document.querySelector('.modal-overlay.active')) {
        this.generateSFDandBMD('keyboard-enter');
      }
    });
  }

  showToast(msg = 'SFD & BMD Generated Successfully') {
    if (!this.dom.toastNotification) return;
    this.dom.toastMsg.textContent = msg;
    this.dom.toastNotification.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.dom.toastNotification.classList.remove('show');
    }, 2500);
  }

  generateSFDandBMD(source = 'button') {
    // 1. Solve Section Mechanics & Equilibrium
    this.update();

    // 2. Force Canvas re-rendering across all 3 viewports
    this.render();

    // 3. Trigger User Feedback Animation & Toast
    const pointsCount = this.currentSolution?.points?.length || 2000;
    this.showToast(`⚡ SFD & BMD Generated (${pointsCount.toLocaleString()} points calculated)`);

    // Subtle button click feedback animation
    const btn = this.dom.btnGenerateDiagrams;
    if (btn) {
      btn.style.transform = 'scale(0.97)';
      setTimeout(() => { btn.style.transform = ''; }, 150);
    }
  }

  addQuickLoad() {
    const type = this.dom.quickLoadType.value;
    const x = Math.max(0, Math.min(this.engine.length, Number(this.dom.quickLoadX.value) || 0));
    const rawMag = Number(this.dom.quickLoadMag.value) || 20;

    if (type === 'point') {
      this.engine.addPointLoad({
        x,
        magnitude: Math.abs(rawMag), // default gravity load
        label: `P${this.engine.pointLoads.length + 1}`
      });
    } else if (type === 'udl') {
      const x2 = Math.min(this.engine.length, x + Math.max(1, this.engine.length * 0.25));
      this.engine.addUDL({
        x1: x,
        x2: Number(x2.toFixed(2)),
        magnitude: Math.abs(rawMag),
        label: `w${this.engine.udlLoads.length + 1}`
      });
    } else if (type === 'moment') {
      this.engine.addMoment({
        x,
        magnitude: rawMag,
        label: `M${this.engine.moments.length + 1}`
      });
    }

    this.generateSFDandBMD('quick-add');
  }

  calcRectZ() {
    const b = Number(this.dom.rectB.value) || 150; // mm
    const h = Number(this.dom.rectH.value) || 300; // mm
    // Z = b * h^2 / 6 in mm^3, convert to cm^3 (/ 1000)
    const z_cm3 = Math.round((b * h * h) / (6 * 1000));
    this.engine.sectionModulus = z_cm3;
    this.dom.valSectionModulus.textContent = `${z_cm3} cm³`;
    this.dom.sliderSectionModulus.value = z_cm3;
    this.dom.numSectionModulus.value = z_cm3;
    this.update();
  }

  openModal(modal) {
    modal.classList.add('active');
    lucide?.createIcons();
  }

  saveLoadFromModal() {
    const type = this.dom.modalLoadType.value;
    const L = this.engine.length;

    if (type === 'point') {
      const x = Math.max(0, Math.min(L, Number(this.dom.modalPlX.value)));
      const rawMag = Number(this.dom.modalPlMag.value);
      const isDown = this.dom.modalPlDir.value === 'down';
      const magnitude = isDown ? Math.abs(rawMag) : -Math.abs(rawMag);

      this.engine.addPointLoad({ x, magnitude, label: `P${this.engine.pointLoads.length + 1}` });
    } else if (type === 'udl') {
      const x1 = Math.max(0, Math.min(L, Number(this.dom.modalUdlX1.value)));
      const x2 = Math.max(0, Math.min(L, Number(this.dom.modalUdlX2.value)));
      const magnitude = Math.abs(Number(this.dom.modalUdlMag.value));

      this.engine.addUDL({ x1, x2, magnitude, label: `w${this.engine.udlLoads.length + 1}` });
    } else if (type === 'moment') {
      const x = Math.max(0, Math.min(L, Number(this.dom.modalMomentX.value)));
      const rawMag = Number(this.dom.modalMomentMag.value);
      const isCW = this.dom.modalMomentDir.value === 'cw';
      const magnitude = isCW ? Math.abs(rawMag) : -Math.abs(rawMag);

      this.engine.addMoment({ x, magnitude, label: `M${this.engine.moments.length + 1}` });
    }

    this.dom.modalAddLoad.classList.remove('active');
    this.generateSFDandBMD('modal-add');
  }

  syncSupportInputs() {
    this.dom.sliderSupportA.value = this.engine.supportA.x;
    this.dom.numSupportA.value = this.engine.supportA.x;
    this.dom.valSupportA.textContent = `${this.engine.supportA.x.toFixed(2)} m`;

    this.dom.sliderSupportB.value = this.engine.supportB.x;
    this.dom.numSupportB.value = this.engine.supportB.x;
    this.dom.valSupportB.textContent = `${this.engine.supportB.x.toFixed(2)} m`;
  }

  loadPresetsList() {
    this.dom.presetsListContainer.innerHTML = '';
    for (const preset of BEAM_PRESETS) {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.innerHTML = `
        <div class="preset-title">
          <span>${preset.title}</span>
          <span class="badge badge-info" style="font-size: 0.65rem;">${preset.category}</span>
        </div>
        <p class="preset-desc">${preset.description}</p>
      `;

      card.addEventListener('click', () => {
        this.applyPreset(preset);
        this.dom.modalPresets.classList.remove('active');
      });

      this.dom.presetsListContainer.appendChild(card);
    }
  }

  applyPreset(preset) {
    const c = preset.config;
    this.engine.setBeamLength(c.length);
    this.engine.supportType = c.supportType;
    this.engine.supportA = { ...c.supportA };
    this.engine.supportB = { ...c.supportB };
    this.engine.clearLoads();

    for (const pl of c.pointLoads) this.engine.addPointLoad(pl);
    for (const udl of c.udlLoads) this.engine.addUDL(udl);
    for (const m of c.moments) this.engine.addMoment(m);

    // Sync UI controls
    this.dom.sliderLength.value = c.length;
    this.dom.numLength.value = c.length;
    this.dom.valLength.textContent = `${c.length.toFixed(2)} m`;

    this.dom.selectSupportSystem.value = c.supportType;
    if (c.supportType === 'two-supports') {
      this.dom.twoSupportsControls.style.display = 'block';
    } else {
      this.dom.twoSupportsControls.style.display = 'none';
    }

    this.syncSupportInputs();
    this.update();
  }

  renderLoadList() {
    const container = this.dom.loadsContainer;
    container.innerHTML = '';

    const items = [];

    if (this.activeTab === 'all' || this.activeTab === 'point') {
      this.engine.pointLoads.forEach(pl => items.push({ type: 'point', load: pl }));
    }
    if (this.activeTab === 'all' || this.activeTab === 'udl') {
      this.engine.udlLoads.forEach(udl => items.push({ type: 'udl', load: udl }));
    }
    if (this.activeTab === 'all' || this.activeTab === 'moment') {
      this.engine.moments.forEach(m => items.push({ type: 'moment', load: m }));
    }

    if (items.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 1.5rem; font-size: 0.8rem;">No loads applied in this category. Click "+ Add Load" to configure.</div>`;
      return;
    }

    items.forEach(({ type, load }) => {
      const el = document.createElement('div');
      el.className = 'load-item';

      let color = 'var(--accent-amber)';
      let desc = '';

      if (type === 'point') {
        color = 'var(--accent-amber)';
        const dir = load.magnitude >= 0 ? '↓ Down' : '↑ Up';
        desc = `<span>${load.label} @ <strong>${load.x.toFixed(2)}m</strong></span> &bull; <span class="load-val">${Math.abs(load.magnitude)} kN (${dir})</span>`;
      } else if (type === 'udl') {
        color = 'var(--accent-cyan)';
        desc = `<span>${load.label} [<strong>${load.x1.toFixed(2)} - ${load.x2.toFixed(2)}m</strong>]</span> &bull; <span class="load-val">${Math.abs(load.magnitude)} kN/m</span>`;
      } else if (type === 'moment') {
        color = 'var(--accent-purple)';
        const rot = load.magnitude >= 0 ? '↻ CW' : '↺ CCW';
        desc = `<span>${load.label} @ <strong>${load.x.toFixed(2)}m</strong></span> &bull; <span class="load-val">${Math.abs(load.magnitude)} kN·m (${rot})</span>`;
      }

      el.innerHTML = `
        <div class="load-meta">
          <div class="load-color-tag" style="background: ${color};"></div>
          <div>${desc}</div>
        </div>
        <div class="load-actions">
          <button class="btn btn-icon btn-danger btn-delete-load" title="Delete Load" style="padding: 0.25rem 0.4rem;">
            <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      `;

      el.querySelector('.btn-delete-load').addEventListener('click', () => {
        this.engine.removeLoad(type, load.id);
        this.update();
      });

      container.appendChild(el);
    });

    lucide?.createIcons();
  }

  showLatexModal() {
    const equations = this.engine.generateLatexEquations(this.currentSolution.reactions);
    this.currentLatex = equations;

    const rEl = document.getElementById('latex-reactions-render');
    const sEl = document.getElementById('latex-shear-render');
    const mEl = document.getElementById('latex-moment-render');

    if (window.katex) {
      katex.render(equations.reactionsLatex, rEl, { displayMode: true });
      katex.render(equations.shearLatex, sEl, { displayMode: true });
      katex.render(equations.momentLatex, mEl, { displayMode: true });
    } else {
      rEl.textContent = equations.reactionsLatex;
      sEl.textContent = equations.shearLatex;
      mEl.textContent = equations.momentLatex;
    }

    this.openModal(this.dom.modalLatex);
  }

  exportCSV() {
    const csvContent = this.engine.exportCSV(this.currentSolution);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `beam_analysis_L${this.engine.length}m_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  update() {
    // 1. Solve Section Mechanics
    this.currentSolution = this.engine.solve();
    const sol = this.currentSolution;
    const diag = sol.diagnostics;

    // 2. Update Counts
    this.dom.countAll.textContent = this.engine.pointLoads.length + this.engine.udlLoads.length + this.engine.moments.length;
    this.dom.countPoint.textContent = this.engine.pointLoads.length;
    this.dom.countUDL.textContent = this.engine.udlLoads.length;
    this.dom.countMoment.textContent = this.engine.moments.length;

    // 3. Update Span indicators
    if (this.engine.supportType === 'two-supports') {
      const leftOverhang = Math.max(0, this.engine.supportA.x);
      const mainSpan = Math.abs(this.engine.supportB.x - this.engine.supportA.x);
      const rightOverhang = Math.max(0, this.engine.length - this.engine.supportB.x);

      this.dom.spanInfoBadge.textContent = `Main Span: ${mainSpan.toFixed(2)} m`;
      this.dom.overhangLeftPill.textContent = `Left Overhang: ${leftOverhang.toFixed(2)} m`;
      this.dom.overhangRightPill.textContent = `Right Overhang: ${rightOverhang.toFixed(2)} m`;
    } else {
      this.dom.spanInfoBadge.textContent = `Cantilever: ${this.engine.length.toFixed(2)} m`;
    }

    // 4. Update Header Equilibrium Badge
    if (diag.balanceCheck) {
      this.dom.equilibriumBadge.className = 'badge badge-success';
      this.dom.equilibriumBadge.innerHTML = `<i data-lucide="check-circle-2"></i> ∑Fy = 0.00 kN [PASS]`;
    } else {
      this.dom.equilibriumBadge.className = 'badge badge-danger';
      this.dom.equilibriumBadge.innerHTML = `<i data-lucide="alert-triangle"></i> Balance Error: ${sol.reactions.balanceError.toFixed(2)} kN`;
    }

    // 5. Update Metrics Cards
    this.dom.metricEquilibrium.textContent = `Δ = ${sol.reactions.balanceError.toFixed(3)} kN`;
    this.dom.metricLoadSum.textContent = `∑F_down: ${diag.totalLoad.toFixed(2)} kN`;

    if (this.engine.supportType === 'two-supports') {
      this.dom.metricReactions.textContent = `R_A: ${sol.reactions.R1.toFixed(1)} | R_B: ${sol.reactions.R2.toFixed(1)}`;
      this.dom.metricReactionsSub.textContent = `Total Reaction: ${diag.totalReaction.toFixed(2)} kN`;
    } else {
      const r = sol.reactions.R1 || sol.reactions.R2;
      this.dom.metricReactions.textContent = `R_fixed: ${r.toFixed(1)} kN`;
      this.dom.metricReactionsSub.textContent = `M_fixed: ${Math.abs(sol.reactions.M_fixed).toFixed(1)} kN·m`;
    }

    this.dom.metricMaxMoment.textContent = `${diag.maxAbsM.toFixed(1)} kN·m`;
    const isSagging = Math.abs(diag.maxM) >= Math.abs(diag.minM);
    this.dom.metricMomentPos.textContent = `At x = ${isSagging ? diag.maxMPos : diag.minMPos} m (${isSagging ? 'Sagging' : 'Hogging'})`;

    this.dom.metricMaxShear.textContent = `${diag.maxAbsV.toFixed(1)} kN`;
    this.dom.metricShearPos.textContent = `At x = ${diag.maxVPos} m`;

    this.dom.metricStress.textContent = `${diag.peakStress} MPa`;
    this.dom.metricSafetyFactor.textContent = `SF: ${diag.safetyFactor} (Allowable: ${this.engine.allowableStress} MPa)`;

    // Stress Badge
    if (diag.stressRatio <= 80) {
      this.dom.stressBadge.className = 'badge badge-success';
      this.dom.stressBadge.textContent = `Safe: ${diag.stressRatio}%`;
    } else if (diag.stressRatio <= 100) {
      this.dom.stressBadge.className = 'badge badge-warning';
      this.dom.stressBadge.textContent = `Caution: ${diag.stressRatio}%`;
    } else {
      this.dom.stressBadge.className = 'badge badge-danger';
      this.dom.stressBadge.textContent = `Overstressed: ${diag.stressRatio}%`;
    }

    // Badges on Diagram Headers
    this.dom.schematicBadge.textContent = `L = ${this.engine.length.toFixed(1)} m`;

    if (diag.zeroShearPoints.length > 0) {
      const firstZero = diag.zeroShearPoints[0];
      this.dom.zeroShearBadge.textContent = `V=0 @ x = ${firstZero.x} m (M = ${firstZero.M} kN·m)`;
    } else {
      this.dom.zeroShearBadge.textContent = `No interior V=0 crossings`;
    }

    this.dom.contraflexureBadge.textContent = `${diag.contraflexurePoints.length} Inflection Point${diag.contraflexurePoints.length === 1 ? '' : 's'}`;

    // 6. Update Equilibrium Math Steps Box
    this.dom.equilibriumStepsContent.textContent = sol.reactions.steps.join('\n');

    // 7. Update Critical Points Table
    this.renderCriticalPointsTable(diag);

    // 8. Update Dynamic Load Items List
    this.renderLoadList();

    // 9. Render Canvas Plots
    this.render();

    lucide?.createIcons();
  }

  renderCriticalPointsTable(diag) {
    const tbody = this.dom.criticalPointsTableBody;
    tbody.innerHTML = '';

    const allCrit = [];

    // Support points
    if (this.engine.supportType === 'two-supports') {
      const evalA = this.engine.evaluateAt(this.engine.supportA.x, this.currentSolution.reactions);
      allCrit.push({ x: this.engine.supportA.x, V: evalA.V, M: evalA.M, type: 'Support A (Pin Reaction)' });

      const evalB = this.engine.evaluateAt(this.engine.supportB.x, this.currentSolution.reactions);
      allCrit.push({ x: this.engine.supportB.x, V: evalB.V, M: evalB.M, type: 'Support B (Roller Reaction)' });
    }

    // Zero shear points
    diag.zeroShearPoints.forEach(zp => allCrit.push({ x: zp.x, V: 0, M: zp.M, type: 'Zero Shear / Local Peak Moment' }));

    // Contraflexure inflection points
    diag.contraflexurePoints.forEach(cp => allCrit.push({ x: cp.x, V: cp.V, M: 0, type: 'Point of Contraflexure (M=0)' }));

    // Peak Extreme points
    allCrit.push({ x: diag.maxMPos, V: this.engine.evaluateAt(diag.maxMPos, this.currentSolution.reactions).V, M: diag.maxM, type: 'Absolute Max Sagging Moment' });
    if (diag.minM < 0) {
      allCrit.push({ x: diag.minMPos, V: this.engine.evaluateAt(diag.minMPos, this.currentSolution.reactions).V, M: diag.minM, type: 'Absolute Max Hogging Moment' });
    }

    // Sort by x
    allCrit.sort((a, b) => a.x - b.x);

    // Remove duplicates within 0.05m
    const filtered = [];
    for (const pt of allCrit) {
      if (!filtered.some(p => Math.abs(p.x - pt.x) < 0.02 && p.type === pt.type)) {
        filtered.push(pt);
      }
    }

    this.dom.critPointsCount.textContent = `${filtered.length} Points`;

    filtered.forEach(pt => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--accent-cyan);">${pt.x.toFixed(2)}</td>
        <td>${pt.V.toFixed(2)}</td>
        <td>${pt.M.toFixed(2)}</td>
        <td style="color: var(--text-muted); font-size: 0.72rem;">${pt.type}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  render() {
    this.renderer.render(this.engine, this.currentSolution);
  }
}

// Start Application on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new BeamApp();
  lucide?.createIcons();
});
