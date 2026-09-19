import { addHours, addMinutes, format, subDays, subHours, subMinutes } from 'date-fns';
import { DEFAULT_CONFIG, SITES, WORK_AREAS } from './constants';
import type {
  AlertItem,
  AppStateData,
  AuditLogEntry,
  Cartridge,
  ExposureRecord,
  GateResult,
  PatternType,
  Shift,
  UserAccount,
  Validity,
  Worker,
  WorkArea,
} from '../types';

/** Deterministic PRNG */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Ava', 'Noah', 'Mia', 'Liam', 'Sofia', 'Ethan', 'Isla', 'Mason', 'Amara', 'Owen',
  'Zoe', 'Kai', 'Nora', 'Leo', 'Priya', 'Diego', 'Elena', 'Ryan', 'Hana', 'Marcus',
  'Yuki', 'Omar', 'Chloe', 'Jamal', 'Freya', 'Carlos', 'Anika', 'Ben',
];
const LAST = [
  'Chen', 'Patel', 'Nguyen', 'Garcia', 'Kim', 'Singh', 'Brooks', 'Torres', 'Walsh', 'Ali',
  'Park', 'Rossi', 'Hughes', 'Morales', 'Fischer', 'Okoro', 'Ibrahim', 'Sato', 'Reid', 'Cruz',
];
const ROLES = ['Field Operator', 'Process Tech', 'Maintenance', 'Shift Lead', 'Lab Tech', 'HSE Specialist'];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function idPad(n: number, width = 4) {
  return String(n).padStart(width, '0');
}

function buildGates(
  validity: Validity,
  imageQuality: number,
  deltaT: number,
  s1: number,
  s2: number,
  s3: number,
  recoveryState: string,
  config = DEFAULT_CONFIG,
): GateResult[] {
  const imageOk = imageQuality >= 0.72;
  const refOk = validity !== 'INVALID' || imageOk;
  const channelOk = Math.abs(s1 - s2) < 0.45 && Math.abs(s2 - s3) < 0.55;
  const timingOk = deltaT >= config.readoutWindowMin && deltaT <= config.readoutWindowMax;
  const recoveryOk = recoveryState === 'BASELINE OK' || recoveryState === 'PARTIAL';
  const calOk = true;

  const gates: GateResult[] = [
    {
      name: 'Image Quality',
      passed: imageOk,
      detail: imageOk ? 'Sharp cartridge face, glare within limits' : 'Blur / glare exceeds threshold',
      value: `${Math.round(imageQuality * 100)}%`,
    },
    {
      name: 'Optical REF W',
      passed: refOk,
      detail: refOk ? 'White reference within band' : 'White reference out of band',
      value: 'PASS',
    },
    {
      name: 'Optical REF G',
      passed: refOk,
      detail: refOk ? 'Grey reference within band' : 'Grey reference out of band',
      value: 'PASS',
    },
    {
      name: 'Optical REF D',
      passed: refOk,
      detail: refOk ? 'Dark reference within band' : 'Dark reference out of band',
      value: 'PASS',
    },
    {
      name: 'S1/S2/S3 Consistency',
      passed: channelOk || validity === 'INDETERMINATE',
      detail: channelOk ? 'Channel fingerprint coherent' : 'Channel disagreement beyond tolerance',
      value: `S1=${s1.toFixed(2)} S2=${s2.toFixed(2)} S3=${s3.toFixed(2)}`,
    },
    {
      name: 'Recovery State',
      passed: recoveryOk,
      detail: `Cartridge reported ${recoveryState}`,
      value: recoveryState,
    },
    {
      name: 'Readout Timing',
      passed: timingOk,
      detail: timingOk
        ? `Δt within validated window (${config.readoutWindowMin}–${config.readoutWindowMax} min)`
        : `Δt ${deltaT} min outside validated window`,
      value: `Δt=${deltaT} min`,
    },
    {
      name: 'Calibration Domain',
      passed: calOk,
      detail: `Bound to ${config.calibrationVersion}`,
      value: config.calibrationVersion,
    },
  ];

  if (validity === 'INVALID') {
    const failIdx = gates.findIndex((g) => !g.passed);
    if (failIdx === -1) gates[0].passed = false;
  }
  return gates;
}

export function generateSeedData(seed = 42): AppStateData {
  const rng = mulberry32(seed);
  const now = new Date();

  const users: UserAccount[] = [
    {
      id: 'U-001',
      name: 'Alex Morgan',
      email: 'admin@h2secho.demo',
      role: 'Admin',
      active: true,
      lastLogin: subHours(now, 2).toISOString(),
    },
    {
      id: 'U-002',
      name: 'Jordan Lee',
      email: 'safety@h2secho.demo',
      role: 'Safety Officer',
      active: true,
      lastLogin: subHours(now, 5).toISOString(),
    },
    {
      id: 'U-003',
      name: 'Sam Rivera',
      email: 'sam.rivera@h2secho.demo',
      role: 'Safety Officer',
      active: true,
      lastLogin: subDays(now, 1).toISOString(),
    },
    {
      id: 'U-004',
      name: 'Casey Quinn',
      email: 'casey.quinn@h2secho.demo',
      role: 'Admin',
      active: false,
      lastLogin: subDays(now, 40).toISOString(),
    },
  ];

  const batches = [
    { id: 'BATCH-2025-A14', chemistryVersion: 'CHEM-V2.1', manufacturedAt: '2025-11-12', count: 20 },
    { id: 'BATCH-2026-B02', chemistryVersion: 'CHEM-V2.2', manufacturedAt: '2026-01-18', count: 18 },
    { id: 'BATCH-2026-C07', chemistryVersion: 'CHEM-V2.2', manufacturedAt: '2026-03-04', count: 12 },
  ];

  const workers: Worker[] = [];
  for (let i = 0; i < 28; i++) {
    const site = i % 2 === 0 ? SITES[0] : SITES[1];
    const areas = WORK_AREAS.filter((a) => a.siteId === site.id);
    const area = pick(rng, areas).area;
    workers.push({
      id: `W-${1000 + i + 42}`,
      employeeId: `EMP-${2400 + i}`,
      name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
      role: pick(rng, ROLES),
      siteId: site.id,
      workArea: area,
      status: i % 11 === 0 ? 'ON LEAVE' : i % 7 === 0 ? 'OFF DUTY' : 'ACTIVE',
      phone: `+1-555-${idPad(100 + i, 4)}`,
      email: `worker${i + 1}@site.demo`,
      assignedCartridgeIds: [],
      joinedAt: subDays(now, 60 + Math.floor(rng() * 400)).toISOString(),
      cumulativeDosePpmH: 0,
    });
  }

  const cartridges: Cartridge[] = [];
  const stages: Cartridge['lifecycleStage'][] = [
    'READY', 'READY', 'READY', 'READY', 'RECOVERY', 'RECOVERY', 'EXPOSURE',
    'BASELINE RECOVERED', 'REUSE', 'EXPIRED', 'READY',
  ];

  for (let i = 0; i < 44; i++) {
    const batch = batches[i % batches.length];
    const site = i % 2 === 0 ? SITES[0] : SITES[1];
    const stage = stages[i % stages.length];
    let status: Cartridge['status'] = 'READY';
    let authenticity: Cartridge['authenticity'] = 'AUTHENTIC';
    let condition: Cartridge['condition'] = 'FRESH';
    let measuredAccuracy = 92 + rng() * 7;
    let removedFromUse = false;
    let removalReason: string | undefined;
    let recoveryProgress = 100;

    if (stage === 'RECOVERY') {
      status = 'RECOVERING';
      recoveryProgress = 25 + Math.floor(rng() * 60);
    } else if (stage === 'EXPOSURE') {
      status = 'READY';
      recoveryProgress = 100;
    } else if (stage === 'BASELINE RECOVERED') {
      status = 'RECOVERING';
      recoveryProgress = 92 + Math.floor(rng() * 8);
    } else if (stage === 'EXPIRED') {
      status = 'EXPIRED';
      recoveryProgress = 0;
    } else if (stage === 'REUSE') {
      status = 'READY';
    } else if (i === 7) {
      status = 'INDETERMINATE';
      measuredAccuracy = 78;
    }

    // Rejected cartridges
    if (i === 12) {
      condition = 'FAULT';
      status = 'REMOVED';
      removedFromUse = true;
      removalReason = 'Wristband QR verification: FAULT detected in sensing film';
      measuredAccuracy = 0;
    }
    if (i === 19) {
      condition = 'DAMAGED';
      status = 'REMOVED';
      removedFromUse = true;
      removalReason = 'Physical damage to cartridge housing — removed from use';
      measuredAccuracy = 0;
    }
    if (i === 23) {
      authenticity = 'AUTHENTIC';
      condition = 'FRESH';
      status = 'REMOVED';
      removedFromUse = true;
      measuredAccuracy = 81.4;
      removalReason = `Measured accuracy 81.4% below threshold (${DEFAULT_CONFIG.accuracyThreshold}%)`;
    }

    const baselineValues = Array.from({ length: 8 }, (_, k) => {
      const base = 0.12 + rng() * 0.04;
      return Number((base + (recoveryProgress / 100) * 0.02 * k * 0.1).toFixed(3));
    });

    const cart: Cartridge = {
      id: `ECH-C-${idPad(300 + i, 5)}`,
      batchId: batch.id,
      chemistryVersion: batch.chemistryVersion,
      calibrationVersion: DEFAULT_CONFIG.calibrationVersion,
      siteId: site.id,
      status,
      lifecycleStage: removedFromUse ? 'EXPIRED' : stage,
      cycleCount: Math.floor(rng() * 10) + (stage === 'EXPIRED' ? 12 : 0),
      lifecycleLimit: DEFAULT_CONFIG.lifecycleLimitDefault,
      authenticity,
      condition,
      measuredAccuracy: Number(measuredAccuracy.toFixed(1)),
      removedFromUse,
      removalReason,
      recoveryProgress,
      baselineValues,
      createdAt: subDays(now, 30 + Math.floor(rng() * 200)).toISOString(),
      lastUsedAt: subDays(now, Math.floor(rng() * 14)).toISOString(),
    };
    cartridges.push(cart);
  }

  // Assign cartridges to workers
  const assignable = cartridges.filter((c) => !c.removedFromUse && c.status !== 'EXPIRED');
  assignable.forEach((c, idx) => {
    const w = workers[idx % workers.length];
    c.assignedWorkerId = w.id;
    if (!w.assignedCartridgeIds.includes(c.id)) w.assignedCartridgeIds.push(c.id);
  });

  const shifts: Shift[] = [];
  // Active shifts
  for (let i = 0; i < 6; i++) {
    const w = workers.filter((x) => x.status === 'ACTIVE')[i];
    const cart = cartridges.find((c) => c.assignedWorkerId === w.id && !c.removedFromUse) || cartridges[i];
    shifts.push({
      id: `SH-2026-${format(now, 'MMdd')}-${String.fromCharCode(65 + i)}`,
      workerId: w.id,
      siteId: w.siteId,
      workArea: w.workArea,
      cartridgeId: cart.id,
      startTime: subHours(now, 1 + rng() * 5).toISOString(),
      status: 'ACTIVE',
    });
  }
  // Awaiting readout
  for (let i = 0; i < 4; i++) {
    const w = workers[8 + i];
    const cart = cartridges[10 + i];
    const start = subHours(now, 10 + i);
    shifts.push({
      id: `SH-2026-${format(start, 'MMdd')}-${String.fromCharCode(75 + i)}`,
      workerId: w.id,
      siteId: w.siteId,
      workArea: w.workArea,
      cartridgeId: cart.id,
      startTime: start.toISOString(),
      endTime: addHours(start, 8).toISOString(),
      status: 'AWAITING READOUT',
    });
  }

  const records: ExposureRecord[] = [];
  const patterns: PatternType[] = ['SPIKE', 'SUSTAINED', 'INTERMITTENT'];
  let recordSeq = 1;

  for (let d = 0; d < 90; d++) {
    const day = subDays(now, d);
    const perDay = d < 3 ? 5 + Math.floor(rng() * 4) : 1 + Math.floor(rng() * 3);
    for (let j = 0; j < perDay; j++) {
      const w = pick(rng, workers);
      const cart =
        cartridges.find((c) => c.assignedWorkerId === w.id && !c.removedFromUse) ||
        pick(rng, cartridges.filter((c) => !c.removedFromUse));
      const start = addHours(day, 6 + Math.floor(rng() * 8));
      const end = addHours(start, 7 + Math.floor(rng() * 3));
      const shiftId = `SH-${format(start, 'yyyy-MMdd')}-${idPad(recordSeq, 3)}`;

      if (d > 0 || j > 2) {
        shifts.push({
          id: shiftId,
          workerId: w.id,
          siteId: w.siteId,
          workArea: w.workArea as WorkArea,
          cartridgeId: cart.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status: 'COMPLETED',
        });
      }

      const roll = rng();
      let validity: Validity = 'VALID';
      let invalidReason: string | undefined;
      if (roll > 0.92) {
        validity = 'INVALID';
        invalidReason = pick(rng, [
          'Image quality below threshold',
          'Readout timing outside validated window',
          'S1/S2/S3 channel inconsistency',
          'Optical reference failure',
        ]);
      } else if (roll > 0.87) {
        validity = 'INDETERMINATE';
        invalidReason = 'Partial recovery state — dose withheld';
      }

      const isHigh = validity === 'VALID' && rng() > 0.94;
      const dose =
        validity === 'VALID'
          ? Number((isHigh ? 8.5 + rng() * 6 : 0.3 + rng() * 6.5).toFixed(2))
          : null;
      const pattern = validity === 'VALID' ? pick(rng, patterns) : null;
      const imageQuality = validity === 'INVALID' && invalidReason?.includes('Image') ? 0.45 + rng() * 0.2 : 0.78 + rng() * 0.2;
      const deltaT =
        validity === 'INVALID' && invalidReason?.includes('timing')
          ? pick(rng, [2, 3, 52, 60])
          : 8 + Math.floor(rng() * 25);
      const s1 = Number((0.4 + rng() * 1.2).toFixed(2));
      const s2 = Number((s1 + (rng() - 0.5) * (validity === 'INVALID' ? 0.9 : 0.25)).toFixed(2));
      const s3 = Number((s2 + (rng() - 0.5) * (validity === 'INVALID' ? 0.9 : 0.3)).toFixed(2));
      const recoveryState = validity === 'INDETERMINATE' ? 'PARTIAL' : pick(rng, ['BASELINE OK', 'BASELINE OK', 'PARTIAL']);
      const capturedAt = addMinutes(end, 5 + Math.floor(rng() * 20));
      const syncedAt = addMinutes(capturedAt, 1 + Math.floor(rng() * 8));

      const rec: ExposureRecord = {
        id: `ER-${format(capturedAt, 'yyyyMMdd')}-${idPad(recordSeq, 4)}`,
        workerId: w.id,
        shiftId: d > 0 || j > 2 ? shiftId : shifts[0].id,
        cartridgeId: cart.id,
        siteId: w.siteId,
        workArea: w.workArea,
        capturedAt: capturedAt.toISOString(),
        syncedAt: syncedAt.toISOString(),
        dosePpmH: dose,
        pattern,
        confidence: Number((validity === 'VALID' ? 0.88 + rng() * 0.11 : 0.4 + rng() * 0.35).toFixed(3)),
        validity,
        invalidReason,
        calibrationVersion: DEFAULT_CONFIG.calibrationVersion,
        chemistryVersion: cart.chemistryVersion,
        phoneReadoutId: `PR-${format(capturedAt, 'yyyyMMdd')}-${idPad(recordSeq, 4)}`,
        imageQuality: Number(imageQuality.toFixed(3)),
        refW: Number((0.92 + rng() * 0.06).toFixed(3)),
        refG: Number((0.48 + rng() * 0.08).toFixed(3)),
        refD: Number((0.08 + rng() * 0.05).toFixed(3)),
        s1,
        s2,
        s3,
        deltaTMinutes: deltaT,
        recoveryState,
        gates: buildGates(validity, imageQuality, deltaT, s1, s2, s3, recoveryState),
        roi: [
          { x: 18, y: 22, w: 28, h: 18, label: 'REF W' },
          { x: 52, y: 22, w: 28, h: 18, label: 'REF G' },
          { x: 18, y: 48, w: 20, h: 28, label: 'S1 FAST' },
          { x: 40, y: 48, w: 20, h: 28, label: 'S2 MEDIUM' },
          { x: 62, y: 48, w: 20, h: 28, label: 'S3 SLOW' },
        ],
      };
      records.push(rec);
      if (dose != null) {
        w.cumulativeDosePpmH = Number((w.cumulativeDosePpmH + dose).toFixed(2));
      }
      recordSeq++;
    }
  }

  // Ensure enough records
  while (records.length < 210) {
    const w = pick(rng, workers);
    const cart = pick(rng, cartridges.filter((c) => !c.removedFromUse));
    const capturedAt = subDays(now, Math.floor(rng() * 80));
    const dose = Number((0.5 + rng() * 5).toFixed(2));
    const s1 = Number((0.5 + rng()).toFixed(2));
    const s2 = Number((s1 + (rng() - 0.5) * 0.2).toFixed(2));
    const s3 = Number((s2 + (rng() - 0.5) * 0.2).toFixed(2));
    const shiftId = `SH-FILL-${idPad(recordSeq, 4)}`;
    shifts.push({
      id: shiftId,
      workerId: w.id,
      siteId: w.siteId,
      workArea: w.workArea,
      cartridgeId: cart.id,
      startTime: subHours(capturedAt, 8).toISOString(),
      endTime: subMinutes(capturedAt, 15).toISOString(),
      status: 'COMPLETED',
    });
    records.push({
      id: `ER-FILL-${idPad(recordSeq, 4)}`,
      workerId: w.id,
      shiftId,
      cartridgeId: cart.id,
      siteId: w.siteId,
      workArea: w.workArea,
      capturedAt: capturedAt.toISOString(),
      syncedAt: addMinutes(capturedAt, 3).toISOString(),
      dosePpmH: dose,
      pattern: pick(rng, patterns),
      confidence: 0.91,
      validity: 'VALID',
      calibrationVersion: DEFAULT_CONFIG.calibrationVersion,
      chemistryVersion: cart.chemistryVersion,
      phoneReadoutId: `PR-FILL-${idPad(recordSeq, 4)}`,
      imageQuality: 0.9,
      refW: 0.95,
      refG: 0.5,
      refD: 0.1,
      s1,
      s2,
      s3,
      deltaTMinutes: 15,
      recoveryState: 'BASELINE OK',
      gates: buildGates('VALID', 0.9, 15, s1, s2, s3, 'BASELINE OK'),
      roi: [
        { x: 18, y: 22, w: 28, h: 18, label: 'REF W' },
        { x: 52, y: 22, w: 28, h: 18, label: 'REF G' },
        { x: 18, y: 48, w: 20, h: 28, label: 'S1 FAST' },
        { x: 40, y: 48, w: 20, h: 28, label: 'S2 MEDIUM' },
        { x: 62, y: 48, w: 20, h: 28, label: 'S3 SLOW' },
      ],
    });
    w.cumulativeDosePpmH = Number((w.cumulativeDosePpmH + dose).toFixed(2));
    recordSeq++;
  }

  records.sort((a, b) => +new Date(b.syncedAt) - +new Date(a.syncedAt));

  const alerts: AlertItem[] = [];
  records
    .filter((r) => r.validity === 'VALID' && (r.dosePpmH ?? 0) >= DEFAULT_CONFIG.doseAlertThreshold)
    .slice(0, 5)
    .forEach((r, i) => {
      alerts.push({
        id: `AL-HE-${idPad(i + 1)}`,
        type: 'HIGH_EXPOSURE',
        severity: 'HIGH',
        status: i === 0 ? 'OPEN' : i === 1 ? 'ACKNOWLEDGED' : 'RESOLVED',
        title: 'High H₂S dose recorded',
        message: `${r.id} reported ${r.dosePpmH} ppm·h — exceeds alert threshold`,
        siteId: r.siteId,
        relatedRecordId: r.id,
        relatedWorkerId: r.workerId,
        createdAt: r.syncedAt,
      });
    });

  records
    .filter((r) => r.validity === 'INVALID')
    .slice(0, 6)
    .forEach((r, i) => {
      alerts.push({
        id: `AL-INV-${idPad(i + 1)}`,
        type: 'INVALID_READING',
        severity: 'MEDIUM',
        status: i < 2 ? 'OPEN' : 'RESOLVED',
        title: 'Invalid reading requires review',
        message: r.invalidReason || 'Gate failure',
        siteId: r.siteId,
        relatedRecordId: r.id,
        relatedWorkerId: r.workerId,
        createdAt: r.syncedAt,
      });
    });

  cartridges
    .filter((c) => c.removedFromUse)
    .forEach((c, i) => {
      alerts.push({
        id: `AL-CF-${idPad(i + 1)}`,
        type: 'CARTRIDGE_FAULT',
        severity: 'HIGH',
        status: 'OPEN',
        title: 'Cartridge removed from use',
        message: c.removalReason || 'Verification failure',
        siteId: c.siteId,
        relatedCartridgeId: c.id,
        createdAt: c.lastUsedAt || c.createdAt,
      });
    });

  const auditLog: AuditLogEntry[] = [
    {
      id: 'AUD-001',
      actorId: 'U-001',
      actorName: 'Alex Morgan',
      action: 'LOGIN',
      entityType: 'User',
      entityId: 'U-001',
      detail: 'Admin signed in',
      timestamp: subHours(now, 2).toISOString(),
    },
    {
      id: 'AUD-002',
      actorId: 'U-002',
      actorName: 'Jordan Lee',
      action: 'ACKNOWLEDGE_ALERT',
      entityType: 'Alert',
      entityId: alerts[1]?.id || 'AL-HE-0002',
      detail: 'Acknowledged high exposure alert',
      timestamp: subHours(now, 4).toISOString(),
    },
    {
      id: 'AUD-003',
      actorId: 'SYSTEM',
      actorName: 'Phone Sync',
      action: 'SYNC_READOUT',
      entityType: 'ExposureRecord',
      entityId: records[0].id,
      detail: 'Phone readout synced from field device',
      timestamp: records[0].syncedAt,
    },
    {
      id: 'AUD-004',
      actorId: 'U-001',
      actorName: 'Alex Morgan',
      action: 'UPDATE_CONFIG',
      entityType: 'Config',
      entityId: 'CONFIG',
      detail: `Accuracy threshold set to ${DEFAULT_CONFIG.accuracyThreshold}%`,
      timestamp: subDays(now, 3).toISOString(),
    },
    {
      id: 'AUD-005',
      actorId: 'U-002',
      actorName: 'Jordan Lee',
      action: 'EXPORT_REPORT',
      entityType: 'Report',
      entityId: 'RPT-WORKER',
      detail: 'Exported worker exposure history CSV',
      timestamp: subDays(now, 1).toISOString(),
    },
  ];

  return {
    sites: SITES,
    workers,
    cartridges,
    shifts,
    records,
    alerts,
    auditLog,
    users,
    config: { ...DEFAULT_CONFIG },
    batches,
  };
}

export function createLiveRecord(
  data: AppStateData,
  kind: 'valid' | 'high' | 'invalid' = 'valid',
): { record: ExposureRecord; alert?: AlertItem } {
  const now = new Date();
  const activeWorkers = data.workers.filter((w) => w.status === 'ACTIVE');
  const w = activeWorkers[Math.floor(Math.random() * activeWorkers.length)] || data.workers[0];
  const cart =
    data.cartridges.find((c) => c.assignedWorkerId === w.id && !c.removedFromUse) ||
    data.cartridges.find((c) => !c.removedFromUse)!;
  const seq = data.records.length + 1;
  const validity: Validity = kind === 'invalid' ? 'INVALID' : 'VALID';
  const dose =
    kind === 'invalid'
      ? null
      : kind === 'high'
        ? Number((data.config.doseAlertThreshold + 1.5 + Math.random() * 4).toFixed(2))
        : Number((0.8 + Math.random() * 4.5).toFixed(2));
  const pattern: PatternType | null =
    kind === 'invalid' ? null : (['SPIKE', 'SUSTAINED', 'INTERMITTENT'] as PatternType[])[Math.floor(Math.random() * 3)];
  const s1 = Number((0.5 + Math.random()).toFixed(2));
  const s2 = Number((s1 + (Math.random() - 0.5) * (kind === 'invalid' ? 0.8 : 0.2)).toFixed(2));
  const s3 = Number((s2 + (Math.random() - 0.5) * (kind === 'invalid' ? 0.8 : 0.25)).toFixed(2));
  const imageQuality = kind === 'invalid' ? 0.48 : 0.88 + Math.random() * 0.1;
  const deltaT = kind === 'invalid' ? 55 : 12 + Math.floor(Math.random() * 15);
  const recoveryState = 'BASELINE OK';
  const invalidReason = kind === 'invalid' ? 'Image quality below threshold' : undefined;
  const capturedAt = now.toISOString();
  const syncedAt = addMinutes(now, 0).toISOString();
  const shiftId = `SH-LIVE-${format(now, 'HHmmss')}`;

  const record: ExposureRecord = {
    id: `ER-LIVE-${format(now, 'yyyyMMdd-HHmmss')}-${idPad(seq % 10000, 4)}`,
    workerId: w.id,
    shiftId,
    cartridgeId: cart.id,
    siteId: w.siteId,
    workArea: w.workArea,
    capturedAt,
    syncedAt,
    dosePpmH: dose,
    pattern,
    confidence: kind === 'invalid' ? 0.42 : 0.93,
    validity,
    invalidReason,
    calibrationVersion: data.config.calibrationVersion,
    chemistryVersion: cart.chemistryVersion,
    phoneReadoutId: `PR-LIVE-${format(now, 'HHmmss')}`,
    imageQuality,
    refW: 0.94,
    refG: 0.51,
    refD: 0.09,
    s1,
    s2,
    s3,
    deltaTMinutes: deltaT,
    recoveryState,
    gates: buildGates(validity, imageQuality, deltaT, s1, s2, s3, recoveryState, data.config),
    roi: [
      { x: 18, y: 22, w: 28, h: 18, label: 'REF W' },
      { x: 52, y: 22, w: 28, h: 18, label: 'REF G' },
      { x: 18, y: 48, w: 20, h: 28, label: 'S1 FAST' },
      { x: 40, y: 48, w: 20, h: 28, label: 'S2 MEDIUM' },
      { x: 62, y: 48, w: 20, h: 28, label: 'S3 SLOW' },
    ],
  };

  let alert: AlertItem | undefined;
  if (kind === 'high') {
    alert = {
      id: `AL-LIVE-HE-${Date.now()}`,
      type: 'HIGH_EXPOSURE',
      severity: 'HIGH',
      status: 'OPEN',
      title: 'High H₂S dose recorded',
      message: `${record.id} reported ${dose} ppm·h — exceeds alert threshold`,
      siteId: w.siteId,
      relatedRecordId: record.id,
      relatedWorkerId: w.id,
      createdAt: syncedAt,
    };
  } else if (kind === 'invalid') {
    alert = {
      id: `AL-LIVE-INV-${Date.now()}`,
      type: 'INVALID_READING',
      severity: 'MEDIUM',
      status: 'OPEN',
      title: 'Invalid reading synced',
      message: invalidReason!,
      siteId: w.siteId,
      relatedRecordId: record.id,
      relatedWorkerId: w.id,
      createdAt: syncedAt,
    };
  }

  return { record, alert };
}
