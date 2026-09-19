import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createLiveRecord, generateSeedData } from '../data/seed';
import type {
  AlertStatus,
  AppConfig,
  AppStateData,
  Cartridge,
  ExposureRecord,
  Role,
  Shift,
  SiteId,
  ToastItem,
  UserAccount,
  Worker,
} from '../types';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Store extends AppStateData {
  user: SessionUser | null;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  selectedSiteId: SiteId | 'ALL';
  toasts: ToastItem[];
  searchQuery: string;
  liveFeedEnabled: boolean;

  login: (email: string, password: string) => boolean;
  logout: () => void;
  setTheme: (t: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSelectedSiteId: (id: SiteId | 'ALL') => void;
  setSearchQuery: (q: string) => void;
  addToast: (t: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;

  addWorker: (w: Omit<Worker, 'id' | 'cumulativeDosePpmH' | 'assignedCartridgeIds'>) => Worker;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  addShift: (s: Omit<Shift, 'id'>) => Shift;
  updateShift: (id: string, patch: Partial<Shift>) => void;
  updateCartridge: (id: string, patch: Partial<Cartridge>) => void;
  updateAlert: (id: string, status: AlertStatus, actorName?: string) => void;
  updateConfig: (patch: Partial<AppConfig>) => void;
  addUser: (u: Omit<UserAccount, 'id'>) => void;
  setUserActive: (id: string, active: boolean) => void;

  pushLiveRecord: (kind?: 'valid' | 'high' | 'invalid') => ExposureRecord;
  resetData: () => void;
  addAudit: (action: string, entityType: string, entityId: string, detail: string) => void;
}

function nextId(prefix: string, existing: string[]) {
  const nums = existing
    .map((id) => parseInt(id.replace(/\D/g, '').slice(-4), 10))
    .filter((n) => !Number.isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `${prefix}${n}`;
}

const seed = generateSeedData();

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...seed,
      user: null,
      theme: 'light',
      sidebarCollapsed: false,
      selectedSiteId: 'ALL',
      toasts: [],
      searchQuery: '',
      liveFeedEnabled: true,

      login: (email, password) => {
        const creds = [
          { email: 'admin@h2secho.demo', password: 'admin123' },
          { email: 'safety@h2secho.demo', password: 'safety123' },
        ];
        const match = creds.find((c) => c.email === email && c.password === password);
        if (!match) return false;
        const account = get().users.find((u) => u.email === email);
        if (!account || !account.active) return false;
        set({
          user: { id: account.id, name: account.name, email: account.email, role: account.role },
        });
        get().addAudit('LOGIN', 'User', account.id, `${account.name} signed in`);
        get().addToast({ type: 'success', title: 'Signed in', message: `Welcome, ${account.name}` });
        return true;
      },

      logout: () => {
        const u = get().user;
        if (u) get().addAudit('LOGOUT', 'User', u.id, `${u.name} signed out`);
        set({ user: null });
      },

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      addToast: (t) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => get().dismissToast(id), 4500);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addWorker: (partial) => {
        const id = nextId('W-', get().workers.map((w) => w.id));
        const worker: Worker = {
          ...partial,
          id,
          assignedCartridgeIds: [],
          cumulativeDosePpmH: 0,
        };
        set((s) => ({ workers: [worker, ...s.workers] }));
        get().addAudit('CREATE_WORKER', 'Worker', id, `Created worker ${worker.name}`);
        get().addToast({ type: 'success', title: 'Worker added', message: worker.id });
        return worker;
      },

      updateWorker: (id, patch) => {
        set((s) => ({
          workers: s.workers.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        }));
        get().addAudit('UPDATE_WORKER', 'Worker', id, 'Worker profile updated');
        get().addToast({ type: 'success', title: 'Worker updated', message: id });
      },

      addShift: (partial) => {
        const now = new Date();
        const id = `SH-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String.fromCharCode(65 + (get().shifts.length % 26))}${get().shifts.length % 10}`;
        const shift: Shift = { ...partial, id };
        set((s) => ({ shifts: [shift, ...s.shifts] }));
        // Mark cartridge in exposure stage if active
        if (shift.status === 'ACTIVE') {
          get().updateCartridge(shift.cartridgeId, { lifecycleStage: 'EXPOSURE', assignedWorkerId: shift.workerId });
        }
        get().addAudit('CREATE_SHIFT', 'Shift', id, `Shift started for ${shift.workerId}`);
        get().addToast({ type: 'success', title: 'Shift created', message: id });
        return shift;
      },

      updateShift: (id, patch) => {
        set((s) => ({
          shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...patch } : sh)),
        }));
        get().addAudit('UPDATE_SHIFT', 'Shift', id, 'Shift status updated');
      },

      updateCartridge: (id, patch) => {
        set((s) => ({
          cartridges: s.cartridges.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },

      updateAlert: (id, status, actorName) => {
        const now = new Date().toISOString();
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  acknowledgedAt: status === 'ACKNOWLEDGED' ? now : a.acknowledgedAt,
                  resolvedAt: status === 'RESOLVED' ? now : a.resolvedAt,
                  acknowledgedBy: actorName || s.user?.name,
                }
              : a,
          ),
        }));
        get().addAudit(
          status === 'RESOLVED' ? 'RESOLVE_ALERT' : 'ACKNOWLEDGE_ALERT',
          'Alert',
          id,
          `Alert marked ${status}`,
        );
        get().addToast({
          type: 'success',
          title: status === 'RESOLVED' ? 'Alert resolved' : 'Alert acknowledged',
          message: id,
        });
      },

      updateConfig: (patch) => {
        set((s) => ({ config: { ...s.config, ...patch } }));
        get().addAudit('UPDATE_CONFIG', 'Config', 'CONFIG', JSON.stringify(patch));
        get().addToast({ type: 'success', title: 'Configuration saved' });
      },

      addUser: (u) => {
        const id = nextId('U-', get().users.map((x) => x.id));
        set((s) => ({ users: [...s.users, { ...u, id }] }));
        get().addAudit('CREATE_USER', 'User', id, `Added ${u.email}`);
        get().addToast({ type: 'success', title: 'User added', message: u.email });
      },

      setUserActive: (id, active) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, active } : u)),
        }));
        get().addAudit(active ? 'ENABLE_USER' : 'DISABLE_USER', 'User', id, active ? 'Enabled' : 'Disabled');
      },

      pushLiveRecord: (kind = 'valid') => {
        const { record, alert } = createLiveRecord(get(), kind);
        set((s) => {
          const workers = s.workers.map((w) =>
            w.id === record.workerId && record.dosePpmH != null
              ? { ...w, cumulativeDosePpmH: Number((w.cumulativeDosePpmH + record.dosePpmH).toFixed(2)) }
              : w,
          );
          const shifts: typeof s.shifts = [
            {
              id: record.shiftId,
              workerId: record.workerId,
              siteId: record.siteId,
              workArea: record.workArea,
              cartridgeId: record.cartridgeId,
              startTime: new Date(Date.now() - 8 * 3600000).toISOString(),
              endTime: new Date(Date.now() - 10 * 60000).toISOString(),
              status: 'COMPLETED',
            },
            ...s.shifts,
          ];
          return {
            records: [record, ...s.records],
            workers,
            shifts,
            alerts: alert ? [alert, ...s.alerts] : s.alerts,
          };
        });
        get().addAudit('SYNC_READOUT', 'ExposureRecord', record.id, 'Phone readout synced from field device');
        if (kind === 'high') {
          get().addToast({
            type: 'error',
            title: 'High exposure synced',
            message: `${record.id} · ${record.dosePpmH} ppm·h`,
          });
        } else if (kind === 'invalid') {
          get().addToast({
            type: 'warning',
            title: 'Invalid reading synced',
            message: record.id,
          });
        } else {
          get().addToast({
            type: 'info',
            title: 'New record from phone',
            message: `${record.id} · ${record.dosePpmH} ppm·h · ${record.pattern}`,
          });
        }
        return record;
      },

      resetData: () => {
        const fresh = generateSeedData(Date.now() % 10000);
        set({
          ...fresh,
          toasts: [],
        });
        get().addToast({ type: 'success', title: 'Demo data reset' });
      },

      addAudit: (action, entityType, entityId, detail) => {
        const u = get().user;
        set((s) => ({
          auditLog: [
            {
              id: `AUD-${Date.now()}`,
              actorId: u?.id || 'SYSTEM',
              actorName: u?.name || 'System',
              action,
              entityType,
              entityId,
              detail,
              timestamp: new Date().toISOString(),
            },
            ...s.auditLog,
          ],
        }));
      },
    }),
    {
      name: 'h2s-echo-web-store',
      partialize: (s) => ({
        workers: s.workers,
        cartridges: s.cartridges,
        shifts: s.shifts,
        records: s.records,
        alerts: s.alerts,
        auditLog: s.auditLog,
        users: s.users,
        config: s.config,
        batches: s.batches,
        theme: s.theme,
        selectedSiteId: s.selectedSiteId,
        sidebarCollapsed: s.sidebarCollapsed,
        user: s.user,
      }),
    },
  ),
);

export function filterBySite<T extends { siteId: SiteId }>(items: T[], siteId: SiteId | 'ALL') {
  if (siteId === 'ALL') return items;
  return items.filter((i) => i.siteId === siteId);
}
