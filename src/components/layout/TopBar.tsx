import { Bell, ChevronDown, LogOut, Moon, Search, Sun, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { cn, fmtRelative } from '../../utils/format';

export function TopBar() {
  const user = useStore((s) => s.user);
  const sites = useStore((s) => s.sites);
  const selectedSiteId = useStore((s) => s.selectedSiteId);
  const setSelectedSiteId = useStore((s) => s.setSelectedSiteId);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);
  const alerts = useStore((s) => s.alerts);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const cartridges = useStore((s) => s.cartridges);
  const records = useStore((s) => s.records);
  const navigate = useNavigate();

  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const openAlerts = alerts.filter((a) => a.status === 'OPEN');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: { type: string; id: string; label: string; to: string }[] = [];
    workers.forEach((w) => {
      if (`${w.id} ${w.name} ${w.employeeId}`.toLowerCase().includes(q))
        out.push({ type: 'Worker', id: w.id, label: `${w.name} · ${w.id}`, to: `/workers/${w.id}` });
    });
    shifts.slice(0, 80).forEach((s) => {
      if (s.id.toLowerCase().includes(q))
        out.push({ type: 'Shift', id: s.id, label: s.id, to: `/shifts/${encodeURIComponent(s.id)}` });
    });
    cartridges.forEach((c) => {
      if (c.id.toLowerCase().includes(q) || c.batchId.toLowerCase().includes(q))
        out.push({ type: 'Cartridge', id: c.id, label: `${c.id} · ${c.status}`, to: `/cartridges/${c.id}` });
    });
    records.slice(0, 100).forEach((r) => {
      if (r.id.toLowerCase().includes(q) || r.phoneReadoutId.toLowerCase().includes(q))
        out.push({ type: 'Record', id: r.id, label: `${r.id} · ${r.validity}`, to: `/records?id=${r.id}` });
    });
    return out.slice(0, 12);
  }, [searchQuery, workers, shifts, cartridges, records]);

  return (
    <header className="h-16 shrink-0 border-b border-steel-200 dark:border-steel-800 bg-white/90 dark:bg-steel-900/90 backdrop-blur flex items-center gap-3 px-4">
      <select
        className="input !w-auto !py-1.5 max-w-[220px]"
        value={selectedSiteId}
        onChange={(e) => setSelectedSiteId(e.target.value as typeof selectedSiteId)}
      >
        <option value="ALL">All Sites</option>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="relative flex-1 max-w-xl" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel-400" />
        <input
          className="input !pl-9"
          placeholder="Search workers, shifts, cartridges, records…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
        />
        {searchOpen && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 panel overflow-hidden z-40">
            {results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-steel-50 dark:hover:bg-steel-800 flex items-center gap-2"
                onClick={() => {
                  navigate(r.to);
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <span className="text-[10px] font-semibold uppercase text-steel-400 w-16">{r.type}</span>
                <span className="mono-id truncate">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className="btn-ghost p-2"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative">
          <button type="button" className="btn-ghost p-2 relative" onClick={() => setBellOpen((v) => !v)}>
            <Bell className="h-5 w-5" />
            {openAlerts.length > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-mono">
                {openAlerts.length}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 panel z-40 overflow-hidden">
              <div className="px-3 py-2 border-b border-steel-200 dark:border-steel-800 text-xs font-semibold uppercase text-steel-500">
                Alerts
              </div>
              <div className="max-h-72 overflow-y-auto">
                {openAlerts.slice(0, 8).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-steel-50 dark:hover:bg-steel-800 border-b border-steel-100 dark:border-steel-800"
                    onClick={() => {
                      setBellOpen(false);
                      navigate('/monitoring');
                    }}
                  >
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-steel-500 mt-0.5">{fmtRelative(a.createdAt)}</div>
                  </button>
                ))}
                {openAlerts.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-steel-500">No open alerts</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            className={cn('btn-ghost !gap-2 pl-2 pr-2')}
            onClick={() => setUserOpen((v) => !v)}
          >
            <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200 flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium leading-tight">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-wide text-steel-500">{user?.role}</div>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
          {userOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 panel z-40 overflow-hidden">
              <div className="px-3 py-2 text-xs text-steel-500 border-b border-steel-200 dark:border-steel-800 font-mono">
                {user?.email}
              </div>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-steel-50 dark:hover:bg-steel-800 text-red-600"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
