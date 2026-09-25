/**
 * Cable Specimen Producer — Application Constants & Seed Data
 * Authoritative workflow stages, seed queue, initial scalar state, and storage keys.
 */

export const INITIAL_STATE = {
  currentView: 'current-job',
  isPaused: false,
  isEstop: false,
  uptimeSeconds: 101672, // 28h 14m 32s
  cycleElapsedSeconds: 165, // 02m 45s
  cycleTotalSeconds: 240, // 04m 00s
  activeStepIndex: 7, // 0-indexed: corresponds to Step 3.1 Outer Sheath Stripping
  specimenCurrent: 4,
  specimenTotal: 6
};

// Workflow stages and substeps mapping exactly to workflow.md
export const WORKFLOW_STEPS = [
  { stage: 1, stageTitle: 'Test and Parameter Setup', code: '1.1', desc: 'Operator Selection (Cable Type & Test Standard)' },
  { stage: 1, stageTitle: 'Test and Parameter Setup', code: '1.2', desc: 'Recipe Loading' },
  
  { stage: 2, stageTitle: 'Cable Preparation', code: '2.1', desc: 'Automated Feeding' },
  { stage: 2, stageTitle: 'Cable Preparation', code: '2.2', desc: 'Cable Detection' },
  { stage: 2, stageTitle: 'Cable Preparation', code: '2.3', desc: 'Diameter Sensing' },
  { stage: 2, stageTitle: 'Cable Preparation', code: '2.4', desc: 'Blade Depth Adjustment' },
  { stage: 2, stageTitle: 'Cable Preparation', code: '2.5', desc: 'Clamping and Positioning' },
  
  { stage: 3, stageTitle: 'Cutting and Extraction', code: '3.1', desc: 'Outer Sheath Stripping' },
  { stage: 3, stageTitle: 'Cutting and Extraction', code: '3.2', desc: 'Insulation Tube Extraction' },
  { stage: 3, stageTitle: 'Cutting and Extraction', code: '3.3', desc: 'Dumbbell Specimen Cutting' },
  
  { stage: 4, stageTitle: 'Finishing and Output', code: '4.1', desc: 'Gauge Line Marking' },
  { stage: 4, stageTitle: 'Finishing and Output', code: '4.2', desc: 'Tray Ejection (triggers Next Specimen Loop back to 2.1)' }
];

export const INITIAL_QUEUE = [
  {
    id: 'JOB-2026-0843',
    name: 'XLPE Sheath Dumbbell Production',
    standard: 'IS 7098 (Parts 1 & 2)',
    specimens: '6 pcs',
    startTime: '19:30:15 (+01m 15s)',
    duration: '04m 00s',
    priority: 'high'
  },
  {
    id: 'JOB-2026-0844',
    name: 'Tensile & Elongation Hot Set Sample',
    standard: 'IS 10810 (Parts 2, 7, 33)',
    specimens: '10 pcs',
    startTime: '19:34:15 (+05m 15s)',
    duration: '06m 15s',
    priority: 'normal'
  },
  {
    id: 'JOB-2026-0845',
    name: 'Single-Core Insulation Stripping',
    standard: 'IS 7098 (Part 1)',
    specimens: '4 pcs',
    startTime: '19:40:30 (+11m 30s)',
    duration: '03m 00s',
    priority: 'normal'
  },
  {
    id: 'JOB-2026-0846',
    name: 'Water Absorption Disc Sample Cut',
    standard: 'IS 10810 (Part 33)',
    specimens: '8 pcs',
    startTime: '19:43:30 (+14m 30s)',
    duration: '05m 15s',
    priority: 'low'
  }
];

export const STORAGE_KEY = 'csp_hmi_settings';
