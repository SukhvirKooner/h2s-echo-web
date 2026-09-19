import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusChip } from '../components/ui/StatusChip';
import { DataTable, type Column } from '../components/ui/DataTable';
import { useStore } from '../store/useStore';
import type { AuditLogEntry } from '../types';
import { fmtDateTime, fmtDose } from '../utils/format';

type ChainNode = {
  key: string;
  label: string;
  id: string;
  meta: string;
  to?: string;
};

export function AuditPage() {
  const [params] = useSearchParams();
  const records = useStore((s) => s.records);
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const cartridges = useStore((s) => s.cartridges);
  const auditLog = useStore((s) => s.auditLog);
  const [recordId, setRecordId] = useState(params.get('record') || records[0]?.id || '');
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const r = params.get('record');
    if (r) setRecordId(r);
  }, [params]);

  const record = records.find((r) => r.id === recordId) || records[0];

  const chain: ChainNode[] = useMemo(() => {
    if (!record) return [];
    const worker = workers.find((w) => w.id === record.workerId);
    const shift = shifts.find((s) => s.id === record.shiftId);
    const cart = cartridges.find((c) => c.id === record.cartridgeId);
    return [
      {
        key: 'worker',
        label: 'WORKER',
        id: record.workerId,
        meta: worker?.name || '',
        to: `/workers/${record.workerId}`,
      },
      {
        key: 'shift',
        label: 'SHIFT',
        id: record.shiftId,
        meta: shift ? fmtDateTime(shift.startTime) : '',
        to: `/shifts/${encodeURIComponent(record.shiftId)}`,
      },
      {
        key: 'cartridge',
        label: 'CARTRIDGE',
        id: record.cartridgeId,
        meta: cart?.chemistryVersion || '',
        to: `/cartridges/${record.cartridgeId}`,
      },
      {
        key: 'exposure',
        label: 'EXPOSURE',
        id: record.id,
        meta: record.validity === 'VALID' ? fmtDose(record.dosePpmH) : record.validity,
        to: `/records?id=${record.id}`,
      },
      {
        key: 'phone',
        label: 'PHONE READOUT',
        id: record.phoneReadoutId,
        meta: fmtDateTime(record.capturedAt),
        to: `/verification?id=${record.id}`,
      },
      {
        key: 'result',
        label: 'RESULT',
        id: record.validity,
        meta: `${record.calibrationVersion} · conf ${(record.confidence * 100).toFixed(0)}%`,
        to: `/verification?id=${record.id}`,
      },
    ];
  }, [record, workers, shifts, cartridges]);

  const detail = useMemo(() => {
    if (!record || !activeNode) return null;
    const node = chain.find((c) => c.key === activeNode);
    if (!node) return null;
    if (activeNode === 'worker') {
      const w = workers.find((x) => x.id === record.workerId);
      return w ? { title: w.name, lines: [`ID ${w.id}`, w.workArea, w.siteId, `Dose ${fmtDose(w.cumulativeDosePpmH)}`] } : null;
    }
    if (activeNode === 'shift') {
      const s = shifts.find((x) => x.id === record.shiftId);
      return s
        ? { title: s.id, lines: [s.status, s.workArea, fmtDateTime(s.startTime), s.endTime ? fmtDateTime(s.endTime) : 'In progress'] }
        : null;
    }
    if (activeNode === 'cartridge') {
      const c = cartridges.find((x) => x.id === record.cartridgeId);
      return c
        ? { title: c.id, lines: [c.status, c.batchId, c.chemistryVersion, c.calibrationVersion] }
        : null;
    }
    return {
      title: record.id,
      lines: [
        record.validity,
        fmtDateTime(record.syncedAt),
        record.calibrationVersion,
        record.phoneReadoutId,
      ],
    };
  }, [activeNode, record, chain, workers, shifts, cartridges]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'ts',
      header: 'When',
      sortable: true,
      sortValue: (r) => r.timestamp,
      render: (r) => <span className="font-mono text-xs">{fmtDateTime(r.timestamp)}</span>,
    },
    { key: 'actor', header: 'Who', render: (r) => r.actorName },
    { key: 'action', header: 'Action', render: (r) => <span className="mono-id text-xs">{r.action}</span> },
    { key: 'entity', header: 'Entity', render: (r) => <span className="mono-id text-xs">{r.entityType}:{r.entityId}</span> },
    { key: 'detail', header: 'Detail', render: (r) => <span className="text-xs">{r.detail}</span> },
  ];

  if (!record) return <div className="panel p-10 text-center">No records</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Audit & Traceability</h1>
        <p className="text-sm text-steel-500 mt-1">
          WORKER → SHIFT → CARTRIDGE → EXPOSURE → PHONE READOUT → RESULT
        </p>
      </div>

      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className="label !mb-0">Result</label>
          <select
            className="input !w-auto font-mono max-w-md"
            value={record.id}
            onChange={(e) => {
              setRecordId(e.target.value);
              setActiveNode(null);
            }}
          >
            {records.slice(0, 100).map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
          <StatusChip status={record.validity} />
        </div>

        <div className="flex flex-wrap items-stretch gap-2">
          {chain.map((node, i) => (
            <div key={node.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveNode(node.key)}
                className={`rounded-xl border px-3 py-3 text-left min-w-[140px] transition hover:border-brand-400 ${
                  activeNode === node.key
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-steel-200 dark:border-steel-800'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-steel-500">{node.label}</div>
                <div className="mono-id text-xs mt-1 truncate max-w-[160px]">{node.id}</div>
                <div className="text-[11px] text-steel-500 mt-0.5 truncate">{node.meta}</div>
              </button>
              {i < chain.length - 1 && <div className="text-steel-300 hidden sm:block">→</div>}
            </div>
          ))}
        </div>

        {detail && (
          <div className="mt-4 rounded-xl bg-steel-50 dark:bg-steel-950 border border-steel-200 dark:border-steel-800 p-4">
            <div className="font-display font-semibold mb-2">{detail.title}</div>
            <ul className="text-sm space-y-1 font-mono text-steel-600 dark:text-steel-300">
              {detail.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {chain.find((c) => c.key === activeNode)?.to && (
              <Link to={chain.find((c) => c.key === activeNode)!.to!} className="btn-secondary mt-3 inline-flex !text-xs">
                Open detail
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="panel p-3">
        <h3 className="font-display font-semibold px-2 pt-2 mb-2">System audit log</h3>
        <DataTable columns={columns} rows={auditLog} pageSize={12} />
      </div>
    </div>
  );
}
