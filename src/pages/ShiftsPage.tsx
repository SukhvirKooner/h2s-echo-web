import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WORK_AREAS } from '../data/constants';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { StatusChip } from '../components/ui/StatusChip';
import { filterBySite, useStore } from '../store/useStore';
import type { Shift, SiteId, WorkArea } from '../types';
import { elapsedSince, fmtDateTime } from '../utils/format';

function LiveTimer({ start }: { start: string }) {
  const [t, setT] = useState(elapsedSince(start));
  useEffect(() => {
    const id = setInterval(() => setT(elapsedSince(start)), 1000);
    return () => clearInterval(id);
  }, [start]);
  return <span className="font-mono text-emerald-700 dark:text-emerald-400">{t}</span>;
}

export function ShiftsPage() {
  const navigate = useNavigate();
  const shifts = useStore((s) => s.shifts);
  const workers = useStore((s) => s.workers);
  const cartridges = useStore((s) => s.cartridges);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const addShift = useStore((s) => s.addShift);
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    workerId: '',
    siteId: 'SITE-NORTH' as SiteId,
    workArea: 'Sour Gas Separation' as WorkArea,
    cartridgeId: '',
    startTime: new Date().toISOString(),
    status: 'ACTIVE' as Shift['status'],
  });

  useEffect(() => {
    if (!form.workerId && workers[0]) {
      const w = workers.find((x) => x.status === 'ACTIVE') || workers[0];
      const cart = cartridges.find((c) => c.assignedWorkerId === w.id && !c.removedFromUse) || cartridges.find((c) => c.status === 'READY');
      setForm((f) => ({
        ...f,
        workerId: w.id,
        siteId: w.siteId,
        workArea: w.workArea,
        cartridgeId: cart?.id || '',
      }));
    }
  }, [workers, cartridges, form.workerId]);

  const rows = useMemo(() => {
    return filterBySite(shifts, selectedSiteId)
      .filter((s) => {
        const w = workers.find((x) => x.id === s.workerId);
        const matchQ =
          !q ||
          `${s.id} ${s.workerId} ${w?.name || ''} ${s.workArea} ${s.cartridgeId}`.toLowerCase().includes(q.toLowerCase());
        return matchQ && (status === 'ALL' || s.status === status);
      })
      .slice(0, 200);
  }, [shifts, selectedSiteId, status, q, workers]);

  const columns: Column<Shift>[] = [
    { key: 'id', header: 'Shift ID', sortable: true, sortValue: (r) => r.id, render: (r) => <span className="mono-id">{r.id}</span> },
    {
      key: 'worker',
      header: 'Worker',
      render: (r) => {
        const w = workers.find((x) => x.id === r.workerId);
        return (
          <div>
            <div className="font-medium">{w?.name}</div>
            <div className="mono-id text-[11px] text-steel-500">{r.workerId}</div>
          </div>
        );
      },
    },
    { key: 'area', header: 'Work Area', render: (r) => r.workArea },
    { key: 'start', header: 'Start', sortable: true, sortValue: (r) => r.startTime, render: (r) => fmtDateTime(r.startTime) },
    {
      key: 'end',
      header: 'End / Timer',
      render: (r) =>
        r.status === 'ACTIVE' ? <LiveTimer start={r.startTime} /> : r.endTime ? fmtDateTime(r.endTime) : '—',
    },
    { key: 'cart', header: 'Cartridge', render: (r) => <span className="mono-id text-xs">{r.cartridgeId}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Shifts</h1>
          <p className="text-sm text-steel-500 mt-1">Active, completed and awaiting readout</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create Shift
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Filter shifts…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="AWAITING READOUT">AWAITING READOUT</option>
        </select>
      </div>

      <div className="panel p-3">
        <DataTable columns={columns} rows={rows} onRowClick={(r) => navigate(`/shifts/${encodeURIComponent(r.id)}`)} pageSize={12} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Shift">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const s = addShift(form);
            setOpen(false);
            navigate(`/shifts/${encodeURIComponent(s.id)}`);
          }}
        >
          <div>
            <label className="label">Worker</label>
            <select
              className="input"
              value={form.workerId}
              onChange={(e) => {
                const w = workers.find((x) => x.id === e.target.value)!;
                const cart = cartridges.find((c) => c.assignedWorkerId === w.id && !c.removedFromUse);
                setForm({
                  ...form,
                  workerId: w.id,
                  siteId: w.siteId,
                  workArea: w.workArea,
                  cartridgeId: cart?.id || form.cartridgeId,
                });
              }}
            >
              {workers.filter((w) => w.status === 'ACTIVE').map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Work Area</label>
            <select className="input" value={form.workArea} onChange={(e) => setForm({ ...form, workArea: e.target.value as WorkArea })}>
              {WORK_AREAS.filter((a) => a.siteId === form.siteId).map((a) => (
                <option key={a.area} value={a.area}>{a.area}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cartridge</label>
            <select className="input font-mono" value={form.cartridgeId} onChange={(e) => setForm({ ...form, cartridgeId: e.target.value })}>
              {cartridges.filter((c) => !c.removedFromUse && c.status !== 'EXPIRED').map((c) => (
                <option key={c.id} value={c.id}>{c.id} · {c.status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Shift['status'] })}>
              <option>ACTIVE</option>
              <option>AWAITING READOUT</option>
              <option>COMPLETED</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
