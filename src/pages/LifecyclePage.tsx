import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatusChip } from '../components/ui/StatusChip';
import { filterBySite, useStore } from '../store/useStore';
import type { Cartridge, LifecycleStage } from '../types';

const STAGES: LifecycleStage[] = [
  'EXPOSURE',
  'RECOVERY',
  'BASELINE RECOVERED',
  'READY',
  'REUSE',
  'EXPIRED',
];

export function LifecyclePage() {
  const cartridges = useStore((s) => s.cartridges);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const siteCarts = filterBySite(cartridges, selectedSiteId);
  const [selectedId, setSelectedId] = useState(siteCarts.find((c) => c.status === 'RECOVERING')?.id || siteCarts[0]?.id);

  const selected = siteCarts.find((c) => c.id === selectedId) || siteCarts[0];

  const byStage = useMemo(() => {
    const map: Record<string, Cartridge[]> = {};
    STAGES.forEach((s) => {
      map[s] = [];
    });
    siteCarts.forEach((c) => {
      const stage = c.removedFromUse ? 'EXPIRED' : c.lifecycleStage;
      if (!map[stage]) map[stage] = [];
      map[stage].push(c);
    });
    return map;
  }, [siteCarts]);

  const stageIndex = selected ? STAGES.indexOf(selected.lifecycleStage) : 0;

  const baselinePlot = selected?.baselineValues.map((v, i) => ({ t: `T${i}`, v })) || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Cartridge Lifecycle</h1>
        <p className="text-sm text-steel-500 mt-1">
          EXPOSURE → RECOVERY → BASELINE RECOVERED → READY → REUSE / EXPIRED
        </p>
      </div>

      {selected && (
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <select
                className="input !w-auto font-mono"
                value={selected.id}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {siteCarts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} · {c.lifecycleStage}
                  </option>
                ))}
              </select>
            </div>
            <StatusChip status={selected.status} />
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-6">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                <div
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide border ${
                    i <= stageIndex
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-steel-50 dark:bg-steel-950 text-steel-400 border-steel-200 dark:border-steel-800'
                  }`}
                >
                  {stage}
                </div>
                {i < STAGES.length - 1 && <div className="w-4 h-0.5 bg-steel-300 dark:bg-steel-700" />}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-display font-semibold mb-2">Recovery / baseline plot</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={baselinePlot}>
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="v" stroke="#d97706" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {selected.status === 'RECOVERING' && (
                <div className="mt-2">
                  <div className="text-xs font-mono mb-1">Recovery {selected.recoveryProgress}%</div>
                  <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${selected.recoveryProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">Cycle count vs lifecycle limit</h4>
              <div className="text-3xl font-mono font-semibold">
                {selected.cycleCount}
                <span className="text-steel-400 text-lg"> / {selected.lifecycleLimit}</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-steel-200 dark:bg-steel-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selected.cycleCount >= selected.lifecycleLimit ? 'bg-red-500' : 'bg-brand-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (selected.cycleCount / selected.lifecycleLimit) * 100)}%`,
                  }}
                />
              </div>
              <Link to={`/cartridges/${selected.id}`} className="btn-secondary mt-4 inline-flex">
                Open cartridge
              </Link>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-semibold mb-3">Kanban by stage</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="min-w-[180px] w-48 shrink-0 rounded-xl bg-steel-100/80 dark:bg-steel-900 border border-steel-200 dark:border-steel-800 p-2"
            >
              <div className="flex items-center justify-between px-1 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide">{stage}</span>
                <span className="font-mono text-xs text-steel-500">{byStage[stage]?.length || 0}</span>
              </div>
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                {(byStage[stage] || []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left rounded-lg bg-white dark:bg-steel-950 border p-2 hover:border-brand-400 ${
                      selectedId === c.id ? 'border-brand-500 ring-1 ring-brand-500/30' : 'border-steel-200 dark:border-steel-800'
                    }`}
                  >
                    <div className="mono-id text-[11px]">{c.id}</div>
                    <div className="mt-1">
                      <StatusChip status={c.status} />
                    </div>
                    <div className="text-[10px] font-mono text-steel-400 mt-1">
                      {c.cycleCount}/{c.lifecycleLimit}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
