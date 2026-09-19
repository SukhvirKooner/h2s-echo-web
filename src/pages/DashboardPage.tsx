import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Cpu, Users, Clock3, FileWarning } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { CountUp } from '../components/ui/CountUp';
import { StatusChip } from '../components/ui/StatusChip';
import { Skeleton } from '../components/ui/Skeleton';
import { filterBySite, useStore } from '../store/useStore';
import { fmtDateTime, fmtDose, fmtRelative } from '../utils/format';

const PIE_COLORS = ['#d97706', '#0284c7', '#7c3aed'];

export function DashboardPage() {
  const navigate = useNavigate();
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const cartridges = useStore((s) => s.cartridges);
  const records = useStore((s) => s.records);
  const alerts = useStore((s) => s.alerts);
  const sites = useStore((s) => s.sites);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const siteWorkers = filterBySite(workers, selectedSiteId);
  const siteShifts = filterBySite(shifts, selectedSiteId);
  const siteCarts = filterBySite(cartridges, selectedSiteId);
  const siteRecords = filterBySite(records, selectedSiteId);
  const siteAlerts = filterBySite(alerts, selectedSiteId);

  const today = format(new Date(), 'yyyy-MM-dd');
  const readingsToday = siteRecords.filter((r) => r.syncedAt.startsWith(today));
  const invalidToday = readingsToday.filter((r) => r.validity === 'INVALID');
  const invalidRate = readingsToday.length
    ? (invalidToday.length / readingsToday.length) * 100
    : siteRecords.slice(0, 50).filter((r) => r.validity === 'INVALID').length * 2;

  const cartByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    siteCarts.forEach((c) => {
      map[c.status] = (map[c.status] || 0) + 1;
    });
    return map;
  }, [siteCarts]);

  const trend = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const key = format(day, 'yyyy-MM-dd');
      const dayRecs = siteRecords.filter((r) => r.syncedAt.startsWith(key) && r.validity === 'VALID');
      const avg =
        dayRecs.length === 0
          ? 0
          : dayRecs.reduce((s, r) => s + (r.dosePpmH || 0), 0) / dayRecs.length;
      return { day: format(day, 'dd MMM'), dose: Number(avg.toFixed(2)) };
    });
  }, [siteRecords]);

  const patternDist = useMemo(() => {
    const counts = { SPIKE: 0, SUSTAINED: 0, INTERMITTENT: 0 };
    siteRecords.forEach((r) => {
      if (r.pattern) counts[r.pattern]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [siteRecords]);

  const recent = siteRecords.slice(0, 8);
  const openAlerts = siteAlerts.filter((a) => a.status === 'OPEN').slice(0, 5);
  const invalidPanel = siteRecords.filter((r) => r.validity !== 'VALID').slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Active Workers',
      value: siteWorkers.filter((w) => w.status === 'ACTIVE').length,
      icon: Users,
      to: '/workers',
    },
    {
      label: 'Active Shifts',
      value: siteShifts.filter((s) => s.status === 'ACTIVE').length,
      icon: Clock3,
      to: '/shifts',
    },
    {
      label: 'Cartridges READY',
      value: cartByStatus.READY || 0,
      icon: Cpu,
      to: '/cartridges',
      sub: `REC ${cartByStatus.RECOVERING || 0} · EXP ${cartByStatus.EXPIRED || 0}`,
    },
    {
      label: 'Readings Today',
      value: readingsToday.length || siteRecords.filter((r) => r.syncedAt > subDays(new Date(), 1).toISOString()).length,
      icon: Activity,
      to: '/records',
    },
    {
      label: 'Invalid Rate',
      value: Number(invalidRate.toFixed(1)),
      decimals: 1,
      suffix: '%',
      icon: FileWarning,
      to: '/verification',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-steel-500 mt-1">
          Live exposure evidence across {selectedSiteId === 'ALL' ? 'all sites' : sites.find((s) => s.id === selectedSiteId)?.name}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <motion.button
            key={k.label}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(k.to)}
            className="panel p-4 text-left hover:border-brand-400 transition"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-steel-500">{k.label}</span>
              <k.icon className="h-4 w-4 text-brand-600" />
            </div>
            <div className="text-2xl font-display font-semibold">
              <CountUp value={k.value} decimals={k.decimals || 0} suffix={k.suffix || ''} />
            </div>
            {k.sub && <p className="text-[11px] font-mono text-steel-400 mt-1">{k.sub}</p>}
          </motion.button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="panel p-4 lg:col-span-2">
          <h3 className="font-display font-semibold mb-3">Dose trend (14-day avg)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="doseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#31917c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#31917c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e9ee" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" ppm·h" width={55} />
                <Tooltip />
                <Area type="monotone" dataKey="dose" stroke="#257465" fill="url(#doseFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Pattern distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={patternDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {patternDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {patternDist.map((p, i) => (
              <span key={p.name} className="text-xs font-mono flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {p.name} {p.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="panel p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold">Live sync feed</h3>
            <span className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-soft" /> Phone
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recent.map((r, i) => (
              <motion.button
                key={r.id}
                type="button"
                layout
                initial={i === 0 ? { opacity: 0, x: -12 } : false}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(`/records?id=${r.id}`)}
                className="w-full text-left rounded-lg border border-steel-100 dark:border-steel-800 p-2.5 hover:bg-brand-50/50 dark:hover:bg-brand-950/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="mono-id text-xs">{r.id}</span>
                  <StatusChip status={r.validity} />
                </div>
                <div className="mt-1 text-xs text-steel-500 flex justify-between">
                  <span>{fmtDose(r.dosePpmH)}</span>
                  <span>{fmtRelative(r.syncedAt)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-display font-semibold">Alerts & invalid</h3>
          </div>
          <div className="space-y-2 mb-4">
            {openAlerts.map((a) => (
              <Link
                key={a.id}
                to="/monitoring"
                className="block rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900 p-2.5 text-sm"
              >
                <div className="font-medium text-red-800 dark:text-red-200">{a.title}</div>
                <div className="text-xs text-red-700/80 dark:text-red-300/80 mt-0.5 font-mono">{a.message}</div>
              </Link>
            ))}
          </div>
          <p className="text-[10px] font-semibold uppercase text-steel-400 mb-2">Recent non-valid</p>
          {invalidPanel.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full flex items-center justify-between py-1.5 text-xs hover:text-brand-700"
              onClick={() => navigate(`/verification?id=${r.id}`)}
            >
              <span className="font-mono">{r.id}</span>
              <StatusChip status={r.validity} />
            </button>
          ))}
        </div>

        <div className="panel p-4">
          <h3 className="font-display font-semibold mb-3">Site status</h3>
          <div className="space-y-3">
            {(selectedSiteId === 'ALL' ? sites : sites.filter((s) => s.id === selectedSiteId)).map((site) => {
              const recs = records.filter((r) => r.siteId === site.id).slice(0, 30);
              const high = recs.filter((r) => (r.dosePpmH || 0) >= 8).length;
              const active = shifts.filter((s) => s.siteId === site.id && s.status === 'ACTIVE').length;
              return (
                <div key={site.id} className="rounded-lg border border-steel-200 dark:border-steel-800 p-3">
                  <div className="font-medium text-sm">{site.name}</div>
                  <div className="text-[11px] text-steel-500 font-mono mt-0.5">{site.id}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-steel-50 dark:bg-steel-950 px-2 py-1.5">
                      Active shifts <span className="font-mono font-semibold float-right">{active}</span>
                    </div>
                    <div className="rounded bg-steel-50 dark:bg-steel-950 px-2 py-1.5">
                      High doses <span className="font-mono font-semibold float-right">{high}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-steel-400 mt-3">
            Latest sync {siteRecords[0] ? fmtDateTime(siteRecords[0].syncedAt) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
