import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { Keyboard } from 'lucide-react';

/** Hidden demo panel — press Ctrl+Shift+D */
export function DemoControls() {
  const [open, setOpen] = useState(false);
  const pushLiveRecord = useStore((s) => s.pushLiveRecord);
  const resetData = useStore((s) => s.resetData);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[90] panel p-3 w-64 shadow-panel">
      <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-steel-500">
        <Keyboard className="h-3.5 w-3.5" /> Demo Controls
      </div>
      <div className="flex flex-col gap-1.5">
        <button type="button" className="btn-secondary !justify-start text-xs" onClick={() => pushLiveRecord('valid')}>
          Push valid record
        </button>
        <button type="button" className="btn-secondary !justify-start text-xs" onClick={() => pushLiveRecord('high')}>
          Push high-exposure alert
        </button>
        <button type="button" className="btn-secondary !justify-start text-xs" onClick={() => pushLiveRecord('invalid')}>
          Push invalid reading
        </button>
        <button type="button" className="btn-danger !justify-start text-xs" onClick={() => resetData()}>
          Reset demo data
        </button>
      </div>
      <p className="mt-2 text-[10px] text-steel-400">Ctrl+Shift+D to toggle</p>
    </div>
  );
}
