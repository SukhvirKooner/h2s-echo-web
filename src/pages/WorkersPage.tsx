import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WORK_AREAS } from '../data/constants';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { StatusChip } from '../components/ui/StatusChip';
import { filterBySite, useStore } from '../store/useStore';
import type { SiteId, WorkArea, Worker } from '../types';
import { fmtDose } from '../utils/format';

export function WorkersPage() {
  const navigate = useNavigate();
  const workers = useStore((s) => s.workers);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const addWorker = useStore((s) => s.addWorker);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    employeeId: '',
    role: 'Field Operator',
    siteId: 'SITE-NORTH' as SiteId,
    workArea: 'Sour Gas Separation' as WorkArea,
    status: 'ACTIVE' as Worker['status'],
    phone: '',
    email: '',
    joinedAt: new Date().toISOString(),
  });

  const rows = useMemo(() => {
    return filterBySite(workers, selectedSiteId).filter((w) => {
      const matchQ =
        !q ||
        `${w.id} ${w.name} ${w.employeeId} ${w.workArea}`.toLowerCase().includes(q.toLowerCase());
      const matchS = status === 'ALL' || w.status === status;
      return matchQ && matchS;
    });
  }, [workers, selectedSiteId, q, status]);

  const columns: Column<Worker>[] = [
    { key: 'id', header: 'Worker ID', sortable: true, sortValue: (r) => r.id, render: (r) => <span className="mono-id">{r.id}</span> },
    { key: 'name', header: 'Name', sortable: true, sortValue: (r) => r.name, render: (r) => r.name },
    { key: 'role', header: 'Role', render: (r) => r.role },
    { key: 'area', header: 'Work Area', render: (r) => r.workArea },
    { key: 'site', header: 'Site', render: (r) => <span className="mono-id text-xs">{r.siteId}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'dose',
      header: 'Cumulative Dose',
      sortable: true,
      sortValue: (r) => r.cumulativeDosePpmH,
      render: (r) => <span className="font-mono">{fmtDose(r.cumulativeDosePpmH)}</span>,
    },
    {
      key: 'carts',
      header: 'Cartridges',
      render: (r) => <span className="font-mono">{r.assignedCartridgeIds.length}</span>,
    },
  ];

  const areasForSite = WORK_AREAS.filter((a) => a.siteId === form.siteId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="text-sm text-steel-500 mt-1">Personnel roster and exposure profiles</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add Worker
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Filter workers…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OFF DUTY">OFF DUTY</option>
          <option value="ON LEAVE">ON LEAVE</option>
        </select>
      </div>

      <div className="panel p-3">
        <DataTable columns={columns} rows={rows} onRowClick={(r) => navigate(`/workers/${r.id}`)} pageSize={12} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Worker">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const w = addWorker(form);
            setOpen(false);
            navigate(`/workers/${w.id}`);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input className="input font-mono" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Worker['status'] })}>
                <option>ACTIVE</option>
                <option>OFF DUTY</option>
                <option>ON LEAVE</option>
              </select>
            </div>
            <div>
              <label className="label">Site</label>
              <select
                className="input"
                value={form.siteId}
                onChange={(e) => {
                  const siteId = e.target.value as SiteId;
                  const area = WORK_AREAS.find((a) => a.siteId === siteId)!.area;
                  setForm({ ...form, siteId, workArea: area });
                }}
              >
                <option value="SITE-NORTH">SITE-NORTH</option>
                <option value="SITE-SOUTH">SITE-SOUTH</option>
              </select>
            </div>
            <div>
              <label className="label">Work Area</label>
              <select className="input" value={form.workArea} onChange={(e) => setForm({ ...form, workArea: e.target.value as WorkArea })}>
                {areasForSite.map((a) => (
                  <option key={a.area} value={a.area}>{a.area}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input font-mono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create Worker</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
