import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';
import { filterBySite, useStore } from '../store/useStore';
import { exportCsv, exportPdf } from '../utils/export';
import { fmtDateTime, fmtDose } from '../utils/format';

type ReportType = 'worker' | 'shift' | 'exposure' | 'cartridge';

export function ReportsPage() {
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const records = useStore((s) => s.records);
  const cartridges = useStore((s) => s.cartridges);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const addAudit = useStore((s) => s.addAudit);
  const [type, setType] = useState<ReportType>('exposure');
  const [workerId, setWorkerId] = useState('ALL');
  const [generating, setGenerating] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);

  const siteWorkers = filterBySite(workers, selectedSiteId);
  const siteRecords = filterBySite(records, selectedSiteId);
  const siteShifts = filterBySite(shifts, selectedSiteId);
  const siteCarts = filterBySite(cartridges, selectedSiteId);

  const previewRows = useMemo(() => {
    if (type === 'worker') {
      return siteWorkers
        .filter((w) => workerId === 'ALL' || w.id === workerId)
        .map((w) => ({
          id: w.id,
          name: w.name,
          area: w.workArea,
          status: w.status,
          cumulativeDose: fmtDose(w.cumulativeDosePpmH),
        }));
    }
    if (type === 'shift') {
      return siteShifts.slice(0, 40).map((s) => ({
        id: s.id,
        worker: s.workerId,
        area: s.workArea,
        status: s.status,
        start: fmtDateTime(s.startTime),
      }));
    }
    if (type === 'cartridge') {
      return siteCarts.map((c) => ({
        id: c.id,
        batch: c.batchId,
        status: c.status,
        accuracy: `${c.measuredAccuracy}%`,
        cycles: `${c.cycleCount}/${c.lifecycleLimit}`,
      }));
    }
    return siteRecords
      .filter((r) => workerId === 'ALL' || r.workerId === workerId)
      .slice(0, 50)
      .map((r) => ({
        id: r.id,
        worker: r.workerId,
        dose: fmtDose(r.dosePpmH),
        pattern: r.pattern || '—',
        validity: r.validity,
        synced: fmtDateTime(r.syncedAt),
      }));
  }, [type, siteWorkers, siteShifts, siteCarts, siteRecords, workerId]);

  const generate = async () => {
    setGenerating(true);
    setReady(false);
    setProgress(0);
    for (let i = 0; i <= 100; i += 8) {
      await new Promise((r) => setTimeout(r, 40));
      setProgress(i);
    }
    setGenerating(false);
    setReady(true);
    addAudit('GENERATE_REPORT', 'Report', type.toUpperCase(), `Generated ${type} report preview`);
  };

  const titles: Record<ReportType, string> = {
    worker: 'Worker Report',
    shift: 'Shift Report',
    exposure: 'Exposure History',
    cartridge: 'Cartridge Report',
  };

  const downloadCsv = () => {
    exportCsv(`h2s-echo-${type}-report.csv`, previewRows as Record<string, unknown>[]);
    addAudit('EXPORT_REPORT', 'Report', type.toUpperCase(), 'CSV export');
  };

  const downloadPdf = () => {
    const cols = Object.keys(previewRows[0] || {});
    const rows = previewRows.map((r) => cols.map((c) => String((r as Record<string, unknown>)[c] ?? '')));
    exportPdf(
      `h2s-echo-${type}-report.pdf`,
      titles[type],
      `Site filter: ${selectedSiteId} · Generated ${new Date().toLocaleString()}`,
      cols,
      rows,
    );
    addAudit('EXPORT_REPORT', 'Report', type.toUpperCase(), 'PDF export');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-sm text-steel-500 mt-1">Generate, preview and download exposure evidence reports</p>
      </div>

      <div className="panel p-5 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              ['worker', 'Worker report'],
              ['shift', 'Shift report'],
              ['exposure', 'Exposure history'],
              ['cartridge', 'Cartridge report'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setType(key);
                setReady(false);
              }}
              className={`rounded-xl border p-4 text-left transition ${
                type === key
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                  : 'border-steel-200 dark:border-steel-800 hover:border-brand-300'
              }`}
            >
              <FileText className="h-5 w-5 text-brand-600 mb-2" />
              <div className="font-semibold text-sm">{label}</div>
            </button>
          ))}
        </div>

        {(type === 'worker' || type === 'exposure') && (
          <div>
            <label className="label">Worker filter</label>
            <select className="input max-w-sm" value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
              <option value="ALL">All workers</option>
              {siteWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.id})
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="button" className="btn-primary" onClick={generate} disabled={generating}>
          {generating ? 'Generating…' : 'Generate report'}
        </button>

        {generating && (
          <div>
            <div className="h-2 rounded-full bg-steel-200 overflow-hidden">
              <motion.div className="h-full bg-brand-600" animate={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs font-mono text-steel-500 mt-1">Compiling evidence package… {progress}%</p>
          </div>
        )}
      </div>

      {ready && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-steel-200 dark:border-steel-800 px-5 py-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-700">H2S-ECHO</div>
              <h2 className="font-display text-lg font-semibold">{titles[type]}</h2>
              <p className="text-xs text-steel-500 font-mono">
                {selectedSiteId} · {previewRows.length} rows · confidential
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={downloadCsv}>
                <FileSpreadsheet className="h-4 w-4" /> CSV
              </button>
              <button type="button" className="btn-primary" onClick={downloadPdf}>
                <Download className="h-4 w-4" /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-auto max-h-[480px]">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(previewRows[0] || {}).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="!cursor-default">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="font-mono text-xs">
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
