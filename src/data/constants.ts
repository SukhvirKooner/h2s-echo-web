import type { AppConfig, Site, SiteId, WorkArea } from '../types';

export const ACCURACY_THRESHOLD = 90;

export const DEFAULT_CONFIG: AppConfig = {
  accuracyThreshold: ACCURACY_THRESHOLD,
  readoutWindowMin: 5,
  readoutWindowMax: 45,
  doseAlertThreshold: 8.0,
  softwareVersion: 'H2S-ECHO-WEB-2.4.1',
  calibrationVersion: 'H2S-ECHO-CAL-V1',
  modelVersion: 'H2S-ECHO-MODEL-V3.2',
  lifecycleLimitDefault: 12,
};

export const SITES: Site[] = [
  { id: 'SITE-NORTH', name: 'North Processing Complex', location: 'Alberta, Canada' },
  { id: 'SITE-SOUTH', name: 'South Wastewater Facility', location: 'Texas, USA' },
];

export const WORK_AREAS: { area: WorkArea; siteId: SiteId }[] = [
  { area: 'Sour Gas Separation', siteId: 'SITE-NORTH' },
  { area: 'Flare Knockout', siteId: 'SITE-NORTH' },
  { area: 'Tank Farm East', siteId: 'SITE-NORTH' },
  { area: 'Wastewater Inlet', siteId: 'SITE-SOUTH' },
  { area: 'Digester Hall', siteId: 'SITE-SOUTH' },
  { area: 'Sulfide Scrubber', siteId: 'SITE-SOUTH' },
];

export const DEMO_CREDENTIALS = [
  { email: 'admin@h2secho.demo', password: 'admin123', role: 'Admin' as const, name: 'Alex Morgan' },
  { email: 'safety@h2secho.demo', password: 'safety123', role: 'Safety Officer' as const, name: 'Jordan Lee' },
];

export const STATUS_COLORS = {
  VALID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  READY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  AUTHENTIC: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  FRESH: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  COMPLETED: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  RECOVERING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  RECOVERY: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'BASELINE RECOVERED': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'AWAITING READOUT': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  SPIKE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  INVALID: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  REMOVED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  DAMAGED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  FAULT: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  INDETERMINATE: 'bg-steel-200 text-steel-700 dark:bg-steel-800 dark:text-steel-300',
  SUSTAINED: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  INTERMITTENT: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  OPEN: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  ACKNOWLEDGED: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  EXPOSURE: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  REUSE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'OFF DUTY': 'bg-steel-200 text-steel-700 dark:bg-steel-800 dark:text-steel-300',
  'ON LEAVE': 'bg-steel-200 text-steel-700 dark:bg-steel-800 dark:text-steel-300',
} as const;

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['Admin', 'Safety Officer'] },
  { to: '/workers', label: 'Workers', icon: 'Users', roles: ['Admin', 'Safety Officer'] },
  { to: '/shifts', label: 'Shifts', icon: 'Clock3', roles: ['Admin', 'Safety Officer'] },
  { to: '/cartridges', label: 'Cartridges', icon: 'Cpu', roles: ['Admin', 'Safety Officer'] },
  { to: '/records', label: 'Exposure Records', icon: 'FileSpreadsheet', roles: ['Admin', 'Safety Officer'] },
  { to: '/verification', label: 'Result Verification', icon: 'ShieldCheck', roles: ['Admin', 'Safety Officer'] },
  { to: '/analytics', label: 'Exposure Analytics', icon: 'BarChart3', roles: ['Admin', 'Safety Officer'] },
  { to: '/lifecycle', label: 'Cartridge Lifecycle', icon: 'RefreshCw', roles: ['Admin', 'Safety Officer'] },
  { to: '/reports', label: 'Reports', icon: 'FileText', roles: ['Admin', 'Safety Officer'] },
  { to: '/monitoring', label: 'Monitoring', icon: 'Radio', roles: ['Admin', 'Safety Officer'] },
  { to: '/audit', label: 'Audit & Traceability', icon: 'GitBranch', roles: ['Admin', 'Safety Officer'] },
  { to: '/system', label: 'System Management', icon: 'Settings', roles: ['Admin'] },
] as const;
