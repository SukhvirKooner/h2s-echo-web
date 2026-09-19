import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../components/ui/Modal';
import { StatusChip } from '../components/ui/StatusChip';
import { CountUp } from '../components/ui/CountUp';
import { filterBySite, useStore } from '../store/useStore';
import { fmtDose, fmtRelative } from '../utils/format';

export function MonitoringPage() {
  const records = useStore((s) => s.records);
  const alerts = useStore((s) => s.alerts);
  const cartridges = useStore((s) => s.cartridges);
  const workers = useStore((s) => s.workers);
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const updateAlert = useStore((s) => s.updateAlert);
  const user = useStore((s) => s.user);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const [threshold, setThreshold] = useState(config.doseAlertThreshold);
  const [confirm, setConfirm] = useState<{ id: string; action: 'ACKNOWLEDGED' | 'RESOLVED' } | null>(null);

  const siteRecords = filterBySite(records, selectedSiteId);
  const siteAlerts = filterBySite(alerts, selectedSiteId);
  const siteCarts = filterBySite(cartridges, selectedSiteId);

  const high = useMemo(
    () =>
      siteRecords.filter(
        (r) => r.validity === 'VALID' && (r.dosePpmH || 0) >= config.doseAlertThreshold,
      ),
    [siteRecords, config.doseAlertThreshold],
  );

  const pendingInvalid = siteRecords.filter((r) => r.validity !== 'VALID').slice(0, 12);
  const recovering = siteCarts.filter((c) => c.status === 'RECOVERING');
  const openAlerts = siteAlerts.filter((a) => a.status !== 'RESOLVED');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Monitoring</h1>
        <p className="text-sm text-steel-500 mt-1">Site-level safety overview and alert actions</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Open alerts', value: openAlerts.filter((a) => a.status === 'OPEN').length, color: 'text-red-600' },
          { label: 'High exposure', value: high.length, color: 'text-red-600' },
          { label: 'Pending / invalid', value: pendingInvalid.length, color: 'text-amber-600' },
          { label: 'Recovering carts', value: recovering.length, color: 'text-amber-600' },
        ].map((k) => (
          <div key={k.label} className="panel p-4">
            <div className="text-xs font-semibold uppercase text-steel-500">{k.label}</div>
            <div className={`text-2xl font-display font-semibold mt-1 ${k.color}`}>
              <CountUp value={k.value} />
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Dose alert threshold (ppm·h)</label>
          <input
            type="number"
            step="0.1"
            className="input !w-32 font-mono"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => updateConfig({ doseAlertThreshold: threshold })}
        >
          Save threshold
        </button>
        <p className="text-xs text-steel-500 pb-2">Current: {config.doseAlertThreshold} ppm·h</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Alerts</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {openAlerts.map((a) => (
              <div key={a.id} className="rounded-lg border border-steel-200 dark:border-steel-800 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{a.title}</div>
                    <div className="text-xs text-steel-500 mt-0.5">{a.message}</div>
                    <div className="text-[11px] font-mono text-steel-400 mt-1">{fmtRelative(a.createdAt)}</div>
                  </div>
                  <StatusChip status={a.status} />
                </div>
                <div className="flex gap-2 mt-2">
                  {a.status === 'OPEN' && (
                    <button
                      type="button"
                      className="btn-secondary !text-xs !py-1"
                      onClick={() => setConfirm({ id: a.id, action: 'ACKNOWLEDGED' })}
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      className="btn-primary !text-xs !py-1"
                      onClick={() => setConfirm({ id: a.id, action: 'RESOLVED' })}
                    >
                      Resolve
                    </button>
                  )}
                  {a.relatedRecordId && (
                    <Link to={`/records?id=${a.relatedRecordId}`} className="btn-ghost !text-xs !py-1">
                      View record
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {openAlerts.length === 0 && <p className="text-sm text-steel-500">No open or acknowledged alerts</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <h3 className="font-display font-semibold mb-3">High / abnormal exposure</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {high.slice(0, 10).map((r) => (
                <Link
                  key={r.id}
                  to={`/records?id=${r.id}`}
                  className="flex justify-between text-sm py-1.5 border-b border-steel-100 dark:border-steel-800 hover:text-brand-700"
                >
                  <span className="mono-id text-xs">{r.id}</span>
                  <span className="font-mono text-red-600">{fmtDose(r.dosePpmH)}</span>
                  <span className="text-xs">{workers.find((w) => w.id === r.workerId)?.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <h3 className="font-display font-semibold mb-3">Pending or invalid readings</h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {pendingInvalid.map((r) => (
                <Link
                  key={r.id}
                  to={`/verification?id=${r.id}`}
                  className="flex justify-between items-center text-sm py-1.5"
                >
                  <span className="mono-id text-xs">{r.id}</span>
                  <StatusChip status={r.validity} />
                </Link>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <h3 className="font-display font-semibold mb-3">Recovery status</h3>
            <div className="space-y-2">
              {recovering.slice(0, 6).map((c) => (
                <Link key={c.id} to={`/cartridges/${c.id}`} className="block">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="mono-id">{c.id}</span>
                    <span className="font-mono">{c.recoveryProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${c.recoveryProgress}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === 'RESOLVED' ? 'Resolve alert?' : 'Acknowledge alert?'}
        message={`This will mark the alert as ${confirm?.action} and update monitoring state everywhere.`}
        confirmLabel={confirm?.action === 'RESOLVED' ? 'Resolve' : 'Acknowledge'}
        onConfirm={() => {
          if (confirm) updateAlert(confirm.id, confirm.action, user?.name);
        }}
      />
    </div>
  );
}
