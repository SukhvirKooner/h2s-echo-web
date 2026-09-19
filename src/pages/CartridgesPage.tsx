import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { QRCode } from '../components/ui/QRCode';
import { StatusChip } from '../components/ui/StatusChip';
import { filterBySite, useStore } from '../store/useStore';
import type { Cartridge } from '../types';
import { fmtDate } from '../utils/format';

function CartridgeDetailBody({
  cart,
  worker,
  threshold,
  onOpenFull,
}: {
  cart: Cartridge;
  worker?: { id: string; name: string };
  threshold: number;
  onOpenFull: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex gap-6 flex-wrap">
        <QRCode value={cart.id} size={120} />
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex gap-2 flex-wrap">
            <StatusChip status={cart.status} />
            <StatusChip status={cart.lifecycleStage} />
            <StatusChip status={cart.condition} />
          </div>
          <div>
            <span className="label">Batch</span>
            <span className="mono-id">{cart.batchId}</span>
          </div>
          <div>
            <span className="label">Chemistry / Calibration</span>
            <span className="mono-id">
              {cart.chemistryVersion} · {cart.calibrationVersion}
            </span>
          </div>
          <div>
            <span className="label">Assigned worker</span>
            {worker ? (
              <span>
                {worker.name} · <span className="mono-id">{worker.id}</span>
              </span>
            ) : (
              '—'
            )}
          </div>
          <div>
            <span className="label">Last used</span>
            {cart.lastUsedAt ? fmtDate(cart.lastUsedAt) : '—'}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-steel-200 dark:border-steel-800 p-4">
        <h4 className="font-display font-semibold mb-3">Wristband QR verification (from app)</h4>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <span className="label">Authenticity</span>
            <StatusChip status={cart.authenticity} />
          </div>
          <div>
            <span className="label">Condition</span>
            <StatusChip status={cart.condition} />
          </div>
          <div>
            <span className="label">Measured accuracy</span>
            <div
              className={`font-mono text-lg font-semibold ${
                cart.measuredAccuracy < threshold ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {cart.measuredAccuracy.toFixed(1)}%
            </div>
            <div className="text-[11px] text-steel-500">Pass threshold {threshold}%</div>
          </div>
        </div>
        {cart.removedFromUse && (
          <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 text-sm text-red-800 dark:text-red-200">
            <strong>REMOVED FROM USE</strong>
            <p className="mt-1">{cart.removalReason}</p>
          </div>
        )}
      </div>

      <div>
        <h4 className="font-display font-semibold mb-2">Cycle history</h4>
        <div className="text-sm font-mono">
          Cycle {cart.cycleCount} of {cart.lifecycleLimit}
        </div>
        <div className="mt-2 h-2 rounded-full bg-steel-200 dark:bg-steel-800 overflow-hidden">
          <div
            className="h-full bg-brand-600 rounded-full"
            style={{ width: `${Math.min(100, (cart.cycleCount / cart.lifecycleLimit) * 100)}%` }}
          />
        </div>
        {cart.status === 'RECOVERING' && (
          <div className="mt-3">
            <span className="label">Recovery progress</span>
            <div className="font-mono">{cart.recoveryProgress}%</div>
            <div className="mt-1 h-2 rounded-full bg-amber-100 dark:bg-amber-950 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${cart.recoveryProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      <button type="button" className="btn-primary" onClick={onOpenFull}>
        View lifecycle board
      </button>
    </div>
  );
}

export function CartridgesPage() {
  const navigate = useNavigate();
  const cartridges = useStore((s) => s.cartridges);
  const workers = useStore((s) => s.workers);
  const config = useStore((s) => s.config);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Cartridge | null>(null);

  const rows = useMemo(() => {
    return filterBySite(cartridges, selectedSiteId).filter((c) => {
      const matchQ =
        !q || `${c.id} ${c.batchId} ${c.chemistryVersion}`.toLowerCase().includes(q.toLowerCase());
      return matchQ && (status === 'ALL' || c.status === status);
    });
  }, [cartridges, selectedSiteId, status, q]);

  const columns: Column<Cartridge>[] = [
    {
      key: 'id',
      header: 'Cartridge ID',
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="mono-id">{r.id}</span>,
    },
    { key: 'batch', header: 'Batch', render: (r) => <span className="mono-id text-xs">{r.batchId}</span> },
    { key: 'chem', header: 'Chemistry', render: (r) => <span className="mono-id text-xs">{r.chemistryVersion}</span> },
    { key: 'cal', header: 'Calibration', render: (r) => <span className="mono-id text-xs">{r.calibrationVersion}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    {
      key: 'acc',
      header: 'Accuracy',
      sortable: true,
      sortValue: (r) => r.measuredAccuracy,
      render: (r) => (
        <span className={`font-mono ${r.measuredAccuracy < config.accuracyThreshold ? 'text-red-600' : ''}`}>
          {r.measuredAccuracy.toFixed(1)}%
        </span>
      ),
    },
    { key: 'cond', header: 'Condition', render: (r) => <StatusChip status={r.condition} /> },
    {
      key: 'cycles',
      header: 'Cycles',
      render: (r) => (
        <span className="font-mono">
          {r.cycleCount}/{r.lifecycleLimit}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Cartridges</h1>
        <p className="text-sm text-steel-500 mt-1">
          Reusable wristband cartridges · accuracy threshold {config.accuracyThreshold}%
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="Filter cartridges…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All statuses</option>
          {['READY', 'RECOVERING', 'EXPIRED', 'INDETERMINATE', 'REMOVED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="panel p-3">
        <DataTable columns={columns} rows={rows} onRowClick={(r) => setSelected(r)} pageSize={12} />
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} wide>
        {selected && (
          <CartridgeDetailBody
            cart={selected}
            worker={workers.find((w) => w.id === selected.assignedWorkerId)}
            threshold={config.accuracyThreshold}
            onOpenFull={() => {
              setSelected(null);
              navigate(`/cartridges/${selected.id}`);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

export function CartridgeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useStore((s) => s.cartridges.find((c) => c.id === id));
  const workers = useStore((s) => s.workers);
  const records = useStore((s) => s.records);
  const config = useStore((s) => s.config);

  if (!cart) {
    return (
      <div className="panel p-10 text-center">
        <p className="mb-4">Cartridge not found</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/cartridges')}>
          Back
        </button>
      </div>
    );
  }

  const worker = workers.find((w) => w.id === cart.assignedWorkerId);
  const history = records.filter((r) => r.cartridgeId === cart.id).slice(0, 15);

  return (
    <div className="space-y-4">
      <button type="button" className="btn-ghost !px-0" onClick={() => navigate('/cartridges')}>
        ← Cartridges
      </button>
      <div className="panel p-5">
        <CartridgeDetailBody
          cart={cart}
          worker={worker}
          threshold={config.accuracyThreshold}
          onOpenFull={() => navigate('/lifecycle')}
        />
      </div>
      <div className="panel p-4">
        <h3 className="font-display font-semibold mb-3">Exposure records on this cartridge</h3>
        <div className="space-y-2">
          {history.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full flex justify-between items-center text-sm border border-steel-100 dark:border-steel-800 rounded-lg px-3 py-2 hover:bg-steel-50 dark:hover:bg-steel-800"
              onClick={() => navigate(`/records?id=${r.id}`)}
            >
              <span className="mono-id">{r.id}</span>
              <StatusChip status={r.validity} />
            </button>
          ))}
          {history.length === 0 && <p className="text-sm text-steel-500">No records yet</p>}
        </div>
      </div>
    </div>
  );
}
