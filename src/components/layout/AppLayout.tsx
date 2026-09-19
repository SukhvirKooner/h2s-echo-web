import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DemoControls } from '../demo/DemoControls';

export function AppLayout() {
  const theme = useStore((s) => s.theme);
  const liveFeedEnabled = useStore((s) => s.liveFeedEnabled);
  const pushLiveRecord = useStore((s) => s.pushLiveRecord);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Simulated phone sync every 12–18s
  useEffect(() => {
    if (!liveFeedEnabled) return;
    let timer: number;
    const schedule = () => {
      const delay = 12000 + Math.random() * 6000;
      timer = window.setTimeout(() => {
        const roll = Math.random();
        if (roll > 0.92) pushLiveRecord('high');
        else if (roll > 0.85) pushLiveRecord('invalid');
        else pushLiveRecord('valid');
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [liveFeedEnabled, pushLiveRecord]);

  return (
    <div className="flex h-screen overflow-hidden bg-steel-50 dark:bg-steel-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          <Outlet />
        </main>
      </div>
      <DemoControls />
    </div>
  );
}
