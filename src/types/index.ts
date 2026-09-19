export type Role = 'Admin' | 'Safety Officer';

export type SiteId = 'SITE-NORTH' | 'SITE-SOUTH';

export type WorkArea =
  | 'Sour Gas Separation'
  | 'Flare Knockout'
  | 'Wastewater Inlet'
  | 'Digester Hall'
  | 'Sulfide Scrubber'
  | 'Tank Farm East';

export type ShiftStatus = 'ACTIVE' | 'COMPLETED' | 'AWAITING READOUT';

export type CartridgeStatus =
  | 'READY'
  | 'RECOVERING'
  | 'EXPIRED'
  | 'INDETERMINATE'
  | 'REMOVED';

export type LifecycleStage =
  | 'EXPOSURE'
  | 'RECOVERY'
  | 'BASELINE RECOVERED'
  | 'READY'
  | 'REUSE'
  | 'EXPIRED';

export type PatternType = 'SPIKE' | 'SUSTAINED' | 'INTERMITTENT';

export type Validity = 'VALID' | 'INVALID' | 'INDETERMINATE';

export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export type CartridgeCondition = 'FRESH' | 'DAMAGED' | 'FAULT';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLogin?: string;
}

export interface Site {
  id: SiteId;
  name: string;
  location: string;
}

export interface Worker {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  siteId: SiteId;
  workArea: WorkArea;
  status: 'ACTIVE' | 'OFF DUTY' | 'ON LEAVE';
  phone: string;
  email: string;
  assignedCartridgeIds: string[];
  joinedAt: string;
  cumulativeDosePpmH: number;
}

export interface Cartridge {
  id: string;
  batchId: string;
  chemistryVersion: string;
  calibrationVersion: string;
  siteId: SiteId;
  status: CartridgeStatus;
  lifecycleStage: LifecycleStage;
  cycleCount: number;
  lifecycleLimit: number;
  authenticity: 'AUTHENTIC' | 'FAILED';
  condition: CartridgeCondition;
  measuredAccuracy: number;
  removedFromUse: boolean;
  removalReason?: string;
  recoveryProgress: number;
  baselineValues: number[];
  assignedWorkerId?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  workerId: string;
  siteId: SiteId;
  workArea: WorkArea;
  cartridgeId: string;
  startTime: string;
  endTime?: string;
  status: ShiftStatus;
  notes?: string;
}

export interface GateResult {
  name: string;
  passed: boolean;
  detail: string;
  value?: string;
}

export interface ExposureRecord {
  id: string;
  workerId: string;
  shiftId: string;
  cartridgeId: string;
  siteId: SiteId;
  workArea: WorkArea;
  capturedAt: string;
  syncedAt: string;
  dosePpmH: number | null;
  pattern: PatternType | null;
  confidence: number;
  validity: Validity;
  invalidReason?: string;
  calibrationVersion: string;
  chemistryVersion: string;
  phoneReadoutId: string;
  imageQuality: number;
  refW: number;
  refG: number;
  refD: number;
  s1: number;
  s2: number;
  s3: number;
  deltaTMinutes: number;
  recoveryState: string;
  gates: GateResult[];
  roi: { x: number; y: number; w: number; h: number; label: string }[];
}

export interface AlertItem {
  id: string;
  type: 'HIGH_EXPOSURE' | 'INVALID_READING' | 'CARTRIDGE_FAULT' | 'RECOVERY' | 'SYSTEM';
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  siteId: SiteId;
  relatedRecordId?: string;
  relatedWorkerId?: string;
  relatedCartridgeId?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
  timestamp: string;
}

export interface AppConfig {
  accuracyThreshold: number;
  readoutWindowMin: number;
  readoutWindowMax: number;
  doseAlertThreshold: number;
  softwareVersion: string;
  calibrationVersion: string;
  modelVersion: string;
  lifecycleLimitDefault: number;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface AppStateData {
  sites: Site[];
  workers: Worker[];
  cartridges: Cartridge[];
  shifts: Shift[];
  records: ExposureRecord[];
  alerts: AlertItem[];
  auditLog: AuditLogEntry[];
  users: UserAccount[];
  config: AppConfig;
  batches: { id: string; chemistryVersion: string; manufacturedAt: string; count: number }[];
}
