import { useState } from 'react';
import { NoPermission } from '../components/ui/NoPermission';
import { Modal } from '../components/ui/Modal';
import { useStore } from '../store/useStore';
import type { Role } from '../types';
import { fmtDateTime } from '../utils/format';

export function SystemPage() {
  const user = useStore((s) => s.user);
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const users = useStore((s) => s.users);
  const batches = useStore((s) => s.batches);
  const addUser = useStore((s) => s.addUser);
  const setUserActive = useStore((s) => s.setUserActive);
  const [form, setForm] = useState({ ...config });
  const [userOpen, setUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Safety Officer' as Role, active: true });

  if (user?.role !== 'Admin') return <NoPermission />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">System Management</h1>
        <p className="text-sm text-steel-500 mt-1">Admin-only configuration, versions and users</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-4">Versions</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-steel-100 dark:border-steel-800 py-2">
              <span className="text-steel-500">Software</span>
              <span className="mono-id">{config.softwareVersion}</span>
            </div>
            <div className="flex justify-between border-b border-steel-100 dark:border-steel-800 py-2">
              <span className="text-steel-500">Calibration</span>
              <span className="mono-id">{config.calibrationVersion}</span>
            </div>
            <div className="flex justify-between border-b border-steel-100 dark:border-steel-800 py-2">
              <span className="text-steel-500">Model</span>
              <span className="mono-id">{config.modelVersion}</span>
            </div>
          </div>
          <p className="text-xs text-steel-500 mt-3">
            Each exposure record stores the calibration version that produced its dose.
          </p>
        </div>

        <div className="panel p-5">
          <h3 className="font-display font-semibold mb-4">Configuration</h3>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              updateConfig(form);
            }}
          >
            <div>
              <label className="label">Accuracy threshold (%)</label>
              <input
                type="number"
                className="input font-mono"
                value={form.accuracyThreshold}
                onChange={(e) => setForm({ ...form, accuracyThreshold: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Readout window min (min)</label>
                <input
                  type="number"
                  className="input font-mono"
                  value={form.readoutWindowMin}
                  onChange={(e) => setForm({ ...form, readoutWindowMin: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Readout window max (min)</label>
                <input
                  type="number"
                  className="input font-mono"
                  value={form.readoutWindowMax}
                  onChange={(e) => setForm({ ...form, readoutWindowMax: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="label">Dose alert threshold (ppm·h)</label>
              <input
                type="number"
                step="0.1"
                className="input font-mono"
                value={form.doseAlertThreshold}
                onChange={(e) => setForm({ ...form, doseAlertThreshold: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Default lifecycle limit</label>
              <input
                type="number"
                className="input font-mono"
                value={form.lifecycleLimitDefault}
                onChange={(e) => setForm({ ...form, lifecycleLimitDefault: Number(e.target.value) })}
              />
            </div>
            <button type="submit" className="btn-primary">
              Save configuration
            </button>
          </form>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="font-display font-semibold mb-3">Cartridge batches</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Chemistry</th>
                <th>Manufactured</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="!cursor-default">
                  <td className="mono-id">{b.id}</td>
                  <td className="mono-id">{b.chemistryVersion}</td>
                  <td className="font-mono text-xs">{b.manufacturedAt}</td>
                  <td className="font-mono">{b.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold">Authorized users</h3>
          <button type="button" className="btn-primary" onClick={() => setUserOpen(true)}>
            Add user
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="!cursor-default">
                  <td>{u.name}</td>
                  <td className="font-mono text-xs">{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-steel-200 text-steel-700 dark:bg-steel-800 dark:text-steel-300'
                      }`}
                    >
                      {u.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{u.lastLogin ? fmtDateTime(u.lastLogin) : '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-ghost !text-xs"
                      onClick={() => setUserActive(u.id, !u.active)}
                      disabled={u.id === user?.id}
                    >
                      {u.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={userOpen} onClose={() => setUserOpen(false)} title="Add user">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addUser(newUser);
            setUserOpen(false);
            setNewUser({ name: '', email: '', role: 'Safety Officer', active: true });
          }}
        >
          <div>
            <label className="label">Name</label>
            <input className="input" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}>
              <option>Admin</option>
              <option>Safety Officer</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setUserOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
