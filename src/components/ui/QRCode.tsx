import { useMemo } from 'react';

/** Deterministic faux-QR pattern for demo cartridges */
export function QRCode({ value, size = 96 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const n = 21;
    const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
    let h = 0;
    for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;

    const finder = (ox: number, oy: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const edge = x === 0 || y === 0 || x === 6 || y === 6;
          const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
          grid[oy + y][ox + x] = edge || core;
        }
      }
    };
    finder(0, 0);
    finder(n - 7, 0);
    finder(0, n - 7);

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (grid[y][x]) continue;
        if ((x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9)) continue;
        h = (h * 1664525 + 1013904223) >>> 0;
        grid[y][x] = h % 3 !== 0;
      }
    }
    return grid;
  }, [value]);

  const cell = size / cells.length;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded bg-white p-1 border border-steel-200">
        {cells.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill="#1b403a"
              />
            ) : null,
          ),
        )}
      </svg>
      <span className="mono-id text-[10px] text-steel-500">{value}</span>
    </div>
  );
}
