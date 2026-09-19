import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatusChip } from '../components/ui/StatusChip';
import { filterBySite, useStore } from '../store/useStore';
import { fmtDateTime, fmtDose } from '../utils/format';

export function VerificationPage() {
  const [params, setParams] = useSearchParams();
  const records = useStore((s) => s.records);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const siteRecords = filterBySite(records, selectedSiteId);
  const [selectedId, setSelectedId] = useState(params.get('id') || siteRecords[0]?.id || '');

  useEffect(() => {
    const id = params.get('id');
    if (id) setSelectedId(id);
  }, [params]);

  const record = siteRecords.find((r) => r.id === selectedId) || siteRecords[0];

  const channelData = useMemo(() => {
    if (!record) return [];
    return [
      { name: 'S1 FAST', value: record.s1 },
      { name: 'S2 MEDIUM', value: record.s2 },
      { name: 'S3 SLOW', value: record.s3 },
    ];
  }, [record]);

  if (!record) {
    return <div className="panel p-10 text-center text-steel-500">No records to verify</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Result Verification</h1>
        <p className="text-sm text-steel-500 mt-1">Gate-by-gate validation of phone readouts</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="label !mb-0">Record</label>
        <select
          className="input !w-auto font-mono max-w-md"
          value={record.id}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setParams({ id: e.target.value });
          }}
        >
          {siteRecords.slice(0, 80).map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} · {r.validity}
            </option>
          ))}
        </select>
        <StatusChip status={record.validity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Captured cartridge image</h3>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-steel-700 via-steel-600 to-brand-900 border border-steel-700">
            {/* Mock cartridge face */}
            <div className="absolute inset-6 rounded-lg bg-steel-200/90 dark:bg-steel-300/90 shadow-inner">
              <div className="absolute top-3 left-3 right-3 flex justify-between text-[10px] font-mono text-steel-700">
                <span>H2S-ECHO</span>
                <span>{record.cartridgeId}</span>
              </div>
              {record.roi.map((roi) => (
                <div
                  key={roi.label}
                  className="absolute border-2 border-brand-600/90 bg-brand-500/10"
                  style={{
                    left: `${roi.x}%`,
                    top: `${roi.y}%`,
                    width: `${roi.w}%`,
                    height: `${roi.h}%`,
                  }}
                >
                  <span className="absolute -top-4 left-0 text-[9px] font-mono font-semibold text-brand-800 bg-white/90 px-1 rounded">
                    {roi.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-white/80 flex justify-between">
              <span>{record.phoneReadoutId}</span>
              <span>IQ {(record.imageQuality * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="rounded bg-steel-50 dark:bg-steel-950 p-2">REF W {record.refW}</div>
            <div className="rounded bg-steel-50 dark:bg-steel-950 p-2">REF G {record.refG}</div>
            <div className="rounded bg-steel-50 dark:bg-steel-950 p-2">REF D {record.refD}</div>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Channel fingerprint</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#257465" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl border border-steel-200 dark:border-steel-800 p-4">
            <div className="label">Final decision</div>
            <div className="flex items-center gap-3 mt-1">
              <StatusChip status={record.validity} className="!text-sm !px-3 !py-1" />
              {record.validity === 'VALID' ? (
                <span className="font-mono text-lg font-semibold">{fmtDose(record.dosePpmH)}</span>
              ) : (
                <span className="text-sm text-steel-500">Dose withheld — invalid/indeterminate records never show a dose</span>
              )}
            </div>
            {record.invalidReason && (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{record.invalidReason}</p>
            )}
            {record.pattern && record.validity === 'VALID' && (
              <div className="mt-2">
                Pattern <StatusChip status={record.pattern} className="ml-1" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="font-display font-semibold mb-3">Verification gates</h3>
        <div className="space-y-2">
          {record.gates.map((g) => (
            <div
              key={g.name}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                g.passed
                  ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
              }`}
            >
              {g.passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{g.name}</span>
                  {g.value && <span className="mono-id text-xs text-steel-500">{g.value}</span>}
                </div>
                <p className="text-xs text-steel-600 dark:text-steel-400 mt-0.5">{g.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-steel-500">
          <span>Δt = {record.deltaTMinutes} min</span>
          <span>Recovery: {record.recoveryState}</span>
          <span className="mono-id">{record.calibrationVersion}</span>
          <span>{fmtDateTime(record.capturedAt)}</span>
          <Link to={`/audit?record=${record.id}`} className="text-brand-700 hover:underline">
            Open traceability →
          </Link>
        </div>
      </div>
    </div>
  );
}
