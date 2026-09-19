import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { WORK_AREAS } from '../data/constants';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { StatusChip } from '../components/ui/StatusChip';
import { filterBySite, useStore } from '../store/useStore';
import type { ExposureRecord } from '../types';
import { fmtDateTime, fmtDose } from '../utils/format';

export function RecordsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const records = useStore((s) => s.records);
  const workers = useStore((s) => s.workers);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const [validity, setValidity] = useState('ALL');
  const [pattern, setPattern] = useState('ALL');
  const [area, setArea] = useState('ALL');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<ExposureRecord | null>(null);

  useEffect(() => {
    const id = params.get('id');
    if (id) {
      const rec = records.find((r) => r.id === id);
      if (rec) setSelected(rec);
    }
  }, [params, records]);

  const rows = useMemo(() => {
    return filterBySite(records, selectedSiteId).filter((r) => {
      const w = workers.find((x) => x.id === r.workerId);
      const matchQ =
        !q ||
        `${r.id} ${r.workerId} ${w?.name || ''} ${r.cartridgeId} ${r.shiftId}`.toLowerCase().includes(q.toLowerCase());
      return (
        matchQ &&
        (validity === 'ALL' || r.validity === validity) &&
        (pattern === 'ALL' || r.pattern === pattern) &&
        (area === 'ALL' || r.workArea === area)
      );
    });
  }, [records, selectedSiteId, validity, pattern, area, q, workers]);

  const columns: Column<ExposureRecord>[] = [
    { key: 'id', header: 'Record', sortable: true, sortValue: (r) => r.id, render: (r) => <span className="mono-id">{r.id}</span> },
    {
      key: 'when',
      header: 'Date/Time',
      sortable: true,
      sortValue: (r) => r.syncedAt,
      render: (r) => <span className="font-mono text-xs">{fmtDateTime(r.syncedAt)}</span>,
    },
    {
      key: 'worker',
      header: 'Worker',
      render: (r) => workers.find((w) => w.id === r.workerId)?.name || r.workerId,
    },
    { key: 'shift', header: 'Shift', render: (r) => <span className="mono-id text-xs">{r.shiftId}</span> },
    { key: 'cart', header: 'Cartridge', render: (r) => <span className="mono-id text-xs">{r.cartridgeId}</span> },
    {
      key: 'dose',
      header: 'Dose',
      sortable: true,
      sortValue: (r) => r.dosePpmH ?? -1,
      render: (r) => <span className="font-mono">{fmtDose(r.dosePpmH)}</span>,
    },
    { key: 'pattern', header: 'Pattern', render: (r) => (r.pattern ? <StatusChip status={r.pattern} /> : '—') },
    {
      key: 'conf',
      header: 'Confidence',
      render: (r) => <span className="font-mono">{(r.confidence * 100).toFixed(0)}%</span>,
    },
    { key: 'val', header: 'Validity', render: (r) => <StatusChip status={r.validity} /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Exposure Records</h1>
        <p className="text-sm text-steel-500 mt-1">Chemical records synced from phone readouts</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search records…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" value={validity} onChange={(e) => setValidity(e.target.value)}>
          <option value="ALL">All validity</option>
          <option value="VALID">VALID</option>
          <option value="INVALID">INVALID</option>
          <option value="INDETERMINATE">INDETERMINATE</option>
        </select>
        <select className="input !w-auto" value={pattern} onChange={(e) => setPattern(e.target.value)}>
          <option value="ALL">All patterns</option>
          <option value="SPIKE">SPIKE</option>
          <option value="SUSTAINED">SUSTAINED</option>
          <option value="INTERMITTENT">INTERMITTENT</option>
        </select>
        <select className="input !w-auto" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="ALL">All areas</option>
          {WORK_AREAS.map((a) => (
            <option key={a.area} value={a.area}>
              {a.area}
            </option>
          ))}
        </select>
      </div>

      <div className="panel p-3">
        <DataTable
          columns={columns}
          rows={rows}
          onRowClick={(r) => {
            setSelected(r);
            setParams({ id: r.id });
          }}
          pageSize={15}
        />
      </div>

      <Drawer
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setParams({});
        }}
        title={selected?.id || 'Record'}
        wide
      >
        {selected && <RecordDrawerBody record={selected} onVerify={() => navigate(`/verification?id=${selected.id}`)} />}
      </Drawer>
    </div>
  );
}

function RecordDrawerBody({ record, onVerify }: { record: ExposureRecord; onVerify: () => void }) {
  const workers = useStore((s) => s.workers);
  const worker = workers.find((w) => w.id === record.workerId);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex gap-2 flex-wrap">
        <StatusChip status={record.validity} />
        {record.pattern && <StatusChip status={record.pattern} />}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="label">Dose</span>
          <div className="font-mono text-lg font-semibold">
            {record.validity === 'VALID' ? fmtDose(record.dosePpmH) : '— (withheld)'}
          </div>
        </div>
        <div>
          <span className="label">Confidence</span>
          <div className="font-mono">{(record.confidence * 100).toFixed(1)}%</div>
        </div>
        <div>
          <span className="label">Worker</span>
          <Link to={`/workers/${record.workerId}`} className="text-brand-700 hover:underline">
            {worker?.name} · {record.workerId}
          </Link>
        </div>
        <div>
          <span className="label">Shift</span>
          <Link to={`/shifts/${encodeURIComponent(record.shiftId)}`} className="mono-id text-brand-700 hover:underline">
            {record.shiftId}
          </Link>
        </div>
        <div>
          <span className="label">Cartridge</span>
          <Link to={`/cartridges/${record.cartridgeId}`} className="mono-id text-brand-700 hover:underline">
            {record.cartridgeId}
          </Link>
        </div>
        <div>
          <span className="label">Phone readout</span>
          <div className="mono-id">{record.phoneReadoutId}</div>
        </div>
        <div>
          <span className="label">Captured</span>
          <div className="font-mono">{fmtDateTime(record.capturedAt)}</div>
        </div>
        <div>
          <span className="label">Synced</span>
          <div className="font-mono">{fmtDateTime(record.syncedAt)}</div>
        </div>
        <div>
          <span className="label">Work area</span>
          <div>{record.workArea}</div>
        </div>
        <div>
          <span className="label">Calibration</span>
          <div className="mono-id">{record.calibrationVersion}</div>
        </div>
      </div>
      {record.invalidReason && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3">
          {record.invalidReason}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn-primary" onClick={onVerify}>
          Open result verification
        </button>
        <Link to={`/audit?record=${record.id}`} className="btn-secondary">
          Traceability chain
        </Link>
      </div>
    </div>
  );
}
