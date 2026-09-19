import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusChip } from '../components/ui/StatusChip';
import { useStore } from '../store/useStore';
import { elapsedSince, fmtDateTime, fmtDose } from '../utils/format';

export function ShiftDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const shiftId = decodeURIComponent(id || '');
  const shifts = useStore((s) => s.shifts);
  const workers = useStore((s) => s.workers);
  const cartridges = useStore((s) => s.cartridges);
  const records = useStore((s) => s.records);
  const updateShift = useStore((s) => s.updateShift);
  const shift = shifts.find((s) => s.id === shiftId);
  const [timer, setTimer] = useState('');

  useEffect(() => {
    if (!shift || shift.status !== 'ACTIVE') return;
    const tick = () => setTimer(elapsedSince(shift.startTime));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [shift]);

  if (!shift) {
    return (
      <div className="panel p-10 text-center">
        <p className="mb-4">Shift not found</p>
        <Link to="/shifts" className="btn-primary">Back</Link>
      </div>
    );
  }

  const worker = workers.find((w) => w.id === shift.workerId);
  const cart = cartridges.find((c) => c.id === shift.cartridgeId);
  const linked = records.filter((r) => r.shiftId === shift.id);

  return (
    <div className="space-y-4">
      <button type="button" className="btn-ghost !px-0" onClick={() => navigate('/shifts')}>
        <ArrowLeft className="h-4 w-4" /> Shifts
      </button>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h1 className="page-title mono-id !text-xl">{shift.id}</h1>
          <StatusChip status={shift.status} />
          {shift.status === 'ACTIVE' && (
            <span className="font-mono text-lg text-emerald-700 dark:text-emerald-400">{timer}</span>
          )}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="label">Worker</span>
            <Link to={`/workers/${worker?.id}`} className="text-brand-700 hover:underline font-medium">
              {worker?.name} · {shift.workerId}
            </Link>
          </div>
          <div>
            <span className="label">Work Area</span>
            <div>{shift.workArea}</div>
          </div>
          <div>
            <span className="label">Site</span>
            <div className="mono-id">{shift.siteId}</div>
          </div>
          <div>
            <span className="label">Start</span>
            <div className="font-mono">{fmtDateTime(shift.startTime)}</div>
          </div>
          <div>
            <span className="label">End</span>
            <div className="font-mono">{shift.endTime ? fmtDateTime(shift.endTime) : '—'}</div>
          </div>
          <div>
            <span className="label">Cartridge</span>
            <Link to={`/cartridges/${shift.cartridgeId}`} className="mono-id text-brand-700 hover:underline">
              {shift.cartridgeId}
            </Link>
            {cart && <div className="mt-1"><StatusChip status={cart.status} /></div>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {shift.status === 'ACTIVE' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                updateShift(shift.id, {
                  status: 'AWAITING READOUT',
                  endTime: new Date().toISOString(),
                })
              }
            >
              End shift → AWAITING READOUT
            </button>
          )}
          {shift.status === 'AWAITING READOUT' && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => updateShift(shift.id, { status: 'COMPLETED' })}
            >
              Mark COMPLETED
            </button>
          )}
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="font-display font-semibold mb-3">Linked exposure records</h3>
        {linked.length === 0 ? (
          <p className="text-sm text-steel-500">No readout linked yet — awaiting phone capture.</p>
        ) : (
          <div className="space-y-2">
            {linked.map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full flex items-center justify-between rounded-lg border border-steel-200 dark:border-steel-800 p-3 hover:bg-steel-50 dark:hover:bg-steel-800"
                onClick={() => navigate(`/records?id=${r.id}`)}
              >
                <span className="mono-id text-sm">{r.id}</span>
                <span className="font-mono text-sm">{fmtDose(r.dosePpmH)}</span>
                <StatusChip status={r.validity} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
