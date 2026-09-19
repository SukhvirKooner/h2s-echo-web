import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { WORK_AREAS } from '../data/constants';
import { filterBySite, useStore } from '../store/useStore';
import type { WorkArea } from '../types';

const PIE = ['#d97706', '#0284c7', '#7c3aed'];

export function AnalyticsPage() {
  const records = useStore((s) => s.records);
  const workers = useStore((s) => s.workers);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const [area, setArea] = useState<WorkArea | 'ALL'>('ALL');
  const [from, setFrom] = useState(format(subDays(new Date(), 60), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filtered = useMemo(() => {
    return filterBySite(records, selectedSiteId).filter((r) => {
      const d = parseISO(r.syncedAt);
      const inRange = !isBefore(d, parseISO(from)) && !isAfter(d, parseISO(to + 'T23:59:59'));
      return inRange && (area === 'ALL' || r.workArea === area);
    });
  }, [records, selectedSiteId, area, from, to]);

  const workerHistory = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      if (r.validity === 'VALID' && r.dosePpmH != null) {
        map.set(r.workerId, (map.get(r.workerId) || 0) + r.dosePpmH);
      }
    });
    return [...map.entries()]
      .map(([id, dose]) => ({
        name: workers.find((w) => w.id === id)?.name.split(' ')[0] || id,
        dose: Number(dose.toFixed(1)),
      }))
      .sort((a, b) => b.dose - a.dose)
      .slice(0, 10);
  }, [filtered, workers]);

  const shiftWise = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      if (r.validity === 'VALID' && r.dosePpmH != null) {
        map.set(r.shiftId, (map.get(r.shiftId) || 0) + r.dosePpmH);
      }
    });
    return [...map.entries()]
      .map(([shift, dose]) => ({ shift: shift.slice(-8), dose: Number(dose.toFixed(2)) }))
      .sort((a, b) => b.dose - a.dose)
      .slice(0, 12);
  }, [filtered]);

  const heatmap = useMemo(() => {
    const weeks = Array.from({ length: 8 }, (_, i) => format(subDays(new Date(), (7 - i) * 7), 'wo'));
    const areas = [...new Set(WORK_AREAS.map((a) => a.area))];
    return areas.map((a) => {
      const row: Record<string, string | number> = { area: a.replace(/ .*/, '') };
      weeks.forEach((w, wi) => {
        const start = subDays(new Date(), (7 - wi) * 7 + 6);
        const end = subDays(new Date(), (7 - wi) * 7);
        const vals = filtered.filter((r) => {
          const d = parseISO(r.syncedAt);
          return r.workArea === a && r.validity === 'VALID' && d >= start && d <= end;
        });
        row[w] = vals.length
          ? Number((vals.reduce((s, r) => s + (r.dosePpmH || 0), 0) / vals.length).toFixed(1))
          : 0;
      });
      return { area: a, weeks: weeks.map((w) => ({ week: w, value: row[w] as number })) };
    });
  }, [filtered]);

  const doseTrend = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const day = subDays(new Date(), 20 - i);
      const key = format(day, 'yyyy-MM-dd');
      const dayRecs = filtered.filter((r) => r.syncedAt.startsWith(key) && r.validity === 'VALID');
      const avg = dayRecs.length
        ? dayRecs.reduce((s, r) => s + (r.dosePpmH || 0), 0) / dayRecs.length
        : 0;
      return { day: format(day, 'dd MMM'), dose: Number(avg.toFixed(2)) };
    });
  }, [filtered]);

  const patterns = useMemo(() => {
    const c = { SPIKE: 0, SUSTAINED: 0, INTERMITTENT: 0 };
    filtered.forEach((r) => {
      if (r.pattern) c[r.pattern]++;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const validityRates = useMemo(() => {
    const total = filtered.length || 1;
    const v = filtered.filter((r) => r.validity === 'VALID').length;
    const inv = filtered.filter((r) => r.validity === 'INVALID').length;
    const ind = filtered.filter((r) => r.validity === 'INDETERMINATE').length;
    return [
      { name: 'VALID', value: Number(((v / total) * 100).toFixed(1)) },
      { name: 'INVALID', value: Number(((inv / total) * 100).toFixed(1)) },
      { name: 'INDETERMINATE', value: Number(((ind / total) * 100).toFixed(1)) },
    ];
  }, [filtered]);

  const repeated = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      if (r.validity === 'VALID' && (r.dosePpmH || 0) > 5) {
        map.set(r.workerId, (map.get(r.workerId) || 0) + 1);
      }
    });
    return [...map.entries()]
      .filter(([, n]) => n >= 2)
      .map(([id, n]) => ({
        worker: workers.find((w) => w.id === id)?.name || id,
        events: n,
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 8);
  }, [filtered, workers]);

  const maxHeat = Math.max(1, ...heatmap.flatMap((h) => h.weeks.map((w) => w.value)));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Exposure Analytics</h1>
        <p className="text-sm text-steel-500 mt-1">All charts re-filter with date range, site and area</p>
      </div>

      <div className="flex flex-wrap gap-2 panel p-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input !w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">Area</label>
          <select className="input !w-auto" value={area} onChange={(e) => setArea(e.target.value as WorkArea | 'ALL')}>
            <option value="ALL">All areas</option>
            {WORK_AREAS.map((a) => (
              <option key={a.area} value={a.area}>
                {a.area}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end text-xs text-steel-500 font-mono pb-2">{filtered.length} records in scope</div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Worker-wise cumulative dose</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerHistory} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="dose" fill="#31917c" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Shift-wise exposure</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftWise}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shift" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="dose" fill="#4e6076" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <h3 className="font-display font-semibold mb-3">Area × week heatmap (avg dose ppm·h)</h3>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left p-2">Area</th>
                {heatmap[0]?.weeks.map((w) => (
                  <th key={w.week} className="p-2 font-mono">
                    W{w.week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row) => (
                <tr key={row.area}>
                  <td className="p-2 whitespace-nowrap font-medium">{row.area}</td>
                  {row.weeks.map((w) => {
                    const intensity = w.value / maxHeat;
                    return (
                      <td key={w.week} className="p-1">
                        <div
                          className="rounded px-2 py-2 text-center font-mono"
                          style={{
                            background: `rgba(37, 116, 101, ${0.08 + intensity * 0.75})`,
                            color: intensity > 0.55 ? '#fff' : undefined,
                          }}
                        >
                          {w.value || '·'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="panel p-4 lg:col-span-1">
          <h3 className="font-display font-semibold mb-3">Dose trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={doseTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="dose" stroke="#257465" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Pattern distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={patterns} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65}>
                  {patterns.map((_, i) => (
                    <Cell key={i} fill={PIE[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Valid vs invalid rates %</h3>
          <div className="space-y-2 mt-2">
            {validityRates.map((v) => (
              <div key={v.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold uppercase">{v.name}</span>
                  <span className="font-mono">{v.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-steel-200 dark:bg-steel-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      v.name === 'VALID' ? 'bg-emerald-500' : v.name === 'INVALID' ? 'bg-red-500' : 'bg-steel-400'
                    }`}
                    style={{ width: `${v.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <h4 className="font-display font-semibold mt-5 mb-2 text-sm">Repeated high exposure</h4>
          {repeated.map((r) => (
            <div key={r.worker} className="flex justify-between text-xs py-1 border-b border-steel-100 dark:border-steel-800">
              <span>{r.worker}</span>
              <span className="font-mono">{r.events} events</span>
            </div>
          ))}
          {repeated.length === 0 && <p className="text-xs text-steel-500">None in selected range</p>}
        </div>
      </div>
    </div>
  );
}
