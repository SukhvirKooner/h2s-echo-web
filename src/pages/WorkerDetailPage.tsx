import { ArrowLeft, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { StatusChip } from '../components/ui/StatusChip';
import { useStore } from '../store/useStore';
import type { ExposureRecord, Worker } from '../types';
import { fmtDate, fmtDateTime, fmtDose } from '../utils/format';

export function WorkerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const workers = useStore((s) => s.workers);
  const cartridges = useStore((s) => s.cartridges);
  const records = useStore((s) => s.records);
  const shifts = useStore((s) => s.shifts);
  const updateWorker = useStore((s) => s.updateWorker);
  const worker = workers.find((w) => w.id === id);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Partial<Worker>>({});

  const workerRecords = useMemo(
    () => records.filter((r) => r.workerId === id).sort((a, b) => +new Date(b.syncedAt) - +new Date(a.syncedAt)),
    [records, id],
  );
  const assigned = cartridges.filter((c) => worker?.assignedCartridgeIds.includes(c.id));
  const workerShifts = shifts.filter((s) => s.workerId === id).slice(0, 8);

  const chartData = useMemo(() => {
    return [...workerRecords]
      .filter((r) => r.validity === 'VALID' && r.dosePpmH != null)
      .slice(0, 30)
      .reverse()
      .map((r) => ({
        date: format(parseISO(r.syncedAt), 'dd MMM'),
        dose: r.dosePpmH as number,
      }));
  }, [workerRecords]);

  if (!worker) {
    return (
      <div className="panel p-10 text-center">
        <p className="mb-4">Worker not found</p>
        <Link to="/workers" className="btn-primary">Back</Link>
      </div>
    );
  }

  const columns: Column<ExposureRecord>[] = [
    { key: 'id', header: 'Record', render: (r) => <span className="mono-id">{r.id}</span> },
    { key: 'when', header: 'Synced', render: (r) => fmtDateTime(r.syncedAt) },
    { key: 'dose', header: 'Dose', render: (r) => <span className="font-mono">{fmtDose(r.dosePpmH)}</span> },
    { key: 'pattern', header: 'Pattern', render: (r) => (r.pattern ? <StatusChip status={r.pattern} /> : '—') },
    { key: 'val', header: 'Validity', render: (r) => <StatusChip status={r.validity} /> },
    { key: 'cart', header: 'Cartridge', render: (r) => <span className="mono-id text-xs">{r.cartridgeId}</span> },
  ];

  return (
    <div className="space-y-4">
      <button type="button" className="btn-ghost !px-0" onClick={() => navigate('/workers')}>
        <ArrowLeft className="h-4 w-4" /> Workers
      </button>

      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title">{worker.name}</h1>
              <StatusChip status={worker.status} />
            </div>
            <p className="mono-id text-steel-500">{worker.id} · {worker.employeeId}</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setForm(worker);
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div><span className="label">Role</span><div>{worker.role}</div></div>
          <div><span className="label">Work Area</span><div>{worker.workArea}</div></div>
          <div><span className="label">Site</span><div className="mono-id">{worker.siteId}</div></div>
          <div><span className="label">Cumulative Dose</span><div className="font-mono font-semibold">{fmtDose(worker.cumulativeDosePpmH)}</div></div>
          <div><span className="label">Phone</span><div className="font-mono">{worker.phone}</div></div>
          <div><span className="label">Email</span><div>{worker.email}</div></div>
          <div><span className="label">Joined</span><div>{fmtDate(worker.joinedAt)}</div></div>
          <div><span className="label">Shifts (recent)</span><div className="font-mono">{workerShifts.length}</div></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Assigned cartridges</h3>
          <div className="space-y-2">
            {assigned.map((c) => (
              <Link key={c.id} to={`/cartridges/${c.id}`} className="flex items-center justify-between rounded-lg border border-steel-200 dark:border-steel-800 p-2.5 hover:bg-steel-50 dark:hover:bg-steel-800">
                <span className="mono-id text-sm">{c.id}</span>
                <StatusChip status={c.status} />
              </Link>
            ))}
            {assigned.length === 0 && <p className="text-sm text-steel-500">No cartridges assigned</p>}
          </div>
          <h3 className="font-display font-semibold mt-5 mb-3">Recent shifts</h3>
          <div className="space-y-2">
            {workerShifts.map((s) => (
              <Link key={s.id} to={`/shifts/${encodeURIComponent(s.id)}`} className="block text-xs font-mono hover:text-brand-700 py-1">
                {s.id} · <StatusChip status={s.status} className="ml-1" />
              </Link>
            ))}
          </div>
        </div>
        <div className="panel p-4 lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">Cumulative dose chart</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9ee" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="dose" stroke="#257465" fill="#abe0d4" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel p-3">
        <h3 className="font-display font-semibold px-2 pt-2 mb-2">Exposure history</h3>
        <DataTable
          columns={columns}
          rows={workerRecords}
          onRowClick={(r) => navigate(`/records?id=${r.id}`)}
          pageSize={8}
        />
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Worker">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            updateWorker(worker.id, form);
            setEditOpen(false);
          }}
        >
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
            <label className="label">Role</label>
            <input className="input" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
