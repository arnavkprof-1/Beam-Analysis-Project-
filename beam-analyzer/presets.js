/**
 * Standard Engineering Beam Presets
 */

export const BEAM_PRESETS = [
  {
    id: 'double-overhang-udl-pl',
    title: 'Standard Double Overhang (UDL + 3 Point Loads)',
    category: 'Overhanging',
    description: '12m beam with 2m left overhang and 2m right overhang, midspan UDL of 15 kN/m, and point loads at both tips and center.',
    config: {
      length: 12,
      supportType: 'two-supports',
      supportA: { x: 2, type: 'pinned' },
      supportB: { x: 10, type: 'roller' },
      pointLoads: [
        { x: 0, magnitude: 20, label: 'Tip Load A' },
        { x: 6, magnitude: 40, label: 'Midspan Load' },
        { x: 12, magnitude: 25, label: 'Tip Load B' }
      ],
      udlLoads: [
        { x1: 2, x2: 10, magnitude: 15, label: 'Main Span UDL' }
      ],
      moments: []
    }
  },
  {
    id: 'single-overhang-cantilever-tip',
    title: 'Single Overhang Cantilever Tip Load',
    category: 'Overhanging',
    description: '10m beam with supports at 0m and 7m, carrying a 50 kN tip load on the 3m overhang with a 10 kN/m distributed load on the main span.',
    config: {
      length: 10,
      supportType: 'two-supports',
      supportA: { x: 0, type: 'pinned' },
      supportB: { x: 7, type: 'roller' },
      pointLoads: [
        { x: 10, magnitude: 50, label: 'Overhang Tip' }
      ],
      udlLoads: [
        { x1: 0, x2: 7, magnitude: 12, label: 'Interior UDL' }
      ],
      moments: []
    }
  },
  {
    id: 'simply-supported-center-load',
    title: 'Simply Supported Center Point Load',
    category: 'Simply Supported',
    description: 'Classic textbook simply supported 8m beam with a 60 kN concentrated load at the exact center (x = 4m).',
    config: {
      length: 8,
      supportType: 'two-supports',
      supportA: { x: 0, type: 'pinned' },
      supportB: { x: 8, type: 'roller' },
      pointLoads: [
        { x: 4, magnitude: 60, label: 'Center Load P' }
      ],
      udlLoads: [],
      moments: []
    }
  },
  {
    id: 'simply-supported-full-udl',
    title: 'Simply Supported Full Uniform Load (wL²/8)',
    category: 'Simply Supported',
    description: '10m simply supported beam under continuous 20 kN/m distributed load demonstrating parabolic bending moment distribution.',
    config: {
      length: 10,
      supportType: 'two-supports',
      supportA: { x: 0, type: 'pinned' },
      supportB: { x: 10, type: 'roller' },
      pointLoads: [],
      udlLoads: [
        { x1: 0, x2: 10, magnitude: 20, label: 'Full Span UDL' }
      ],
      moments: []
    }
  },
  {
    id: 'symmetric-train-loading',
    title: 'Symmetric Two-Axle Wheel / Crane Loading',
    category: 'Transportation',
    description: '14m bridge girder subjected to two 45 kN wheel axle loads spaced 3m apart traversing near the center.',
    config: {
      length: 14,
      supportType: 'two-supports',
      supportA: { x: 1, type: 'pinned' },
      supportB: { x: 13, type: 'roller' },
      pointLoads: [
        { x: 5.5, magnitude: 45, label: 'Axle 1' },
        { x: 8.5, magnitude: 45, label: 'Axle 2' }
      ],
      udlLoads: [
        { x1: 0, x2: 14, magnitude: 5, label: 'Beam Self-Weight' }
      ],
      moments: []
    }
  },
  {
    id: 'overhang-couple-moment',
    title: 'Overhanging Beam with Couple Moment & UDL',
    category: 'Overhanging',
    description: '9m beam with an applied 35 kN·m concentrated moment inducing pure rotational step change in the BMD.',
    config: {
      length: 9,
      supportType: 'two-supports',
      supportA: { x: 1.5, type: 'pinned' },
      supportB: { x: 7.5, type: 'roller' },
      pointLoads: [
        { x: 0, magnitude: 15, label: 'Left Overhang Load' }
      ],
      udlLoads: [
        { x1: 1.5, x2: 7.5, magnitude: 10, label: 'Main Span UDL' }
      ],
      moments: [
        { x: 4.5, magnitude: 40, label: 'Concentrated Moment' }
      ]
    }
  },
  {
    id: 'pure-cantilever-tip-load',
    title: 'Pure Cantilever with UDL and Tip Moment',
    category: 'Cantilever',
    description: '6m fixed cantilever clamped at x = 0m, with 12 kN/m uniform load and 25 kN·m tip moment at free end.',
    config: {
      length: 6,
      supportType: 'cantilever-left',
      supportA: { x: 0, type: 'pinned' },
      supportB: { x: 6, type: 'roller' },
      pointLoads: [
        { x: 6, magnitude: 30, label: 'Tip Point Load' }
      ],
      udlLoads: [
        { x1: 0, x2: 4, magnitude: 12, label: 'Distributed Load' }
      ],
      moments: [
        { x: 6, magnitude: 25, label: 'Tip Couple' }
      ]
    }
  }
];
