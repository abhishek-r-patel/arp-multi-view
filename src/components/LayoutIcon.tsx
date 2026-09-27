// Small SVG glyph for each layout switch button: square-grid icons for auto/2x2/4x4 (cell
// count signals density) and a distinct main+side-column icon for Spotlight.
import type { LayoutMode } from '../types';

interface Props {
  mode: LayoutMode;
}

const GAP = 1.5;

// n x n equal squares laid out inside the shared 24x24 viewBox.
function SquareGrid({ n }: { n: number }) {
  const size = (24 - GAP * (n + 1)) / n;
  const cells = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const x = GAP + col * (size + GAP);
      const y = GAP + row * (size + GAP);
      cells.push(<rect key={`${row}-${col}`} x={x} y={y} width={size} height={size} rx={size / 4} />);
    }
  }
  return <>{cells}</>;
}

export function LayoutIcon({ mode }: Props) {
  if (mode === 'spotlight') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <rect x="2" y="3" width="13" height="18" rx="1.5" />
        <rect x="17" y="3" width="5" height="5" rx="1" />
        <rect x="17" y="9.5" width="5" height="5" rx="1" />
        <rect x="17" y="16" width="5" height="5" rx="1" />
      </svg>
    );
  }

  // 'auto' uses a 3x3 grid so its density visually sits between 2x2 and 4x4.
  const n = mode === 'grid2x2' ? 2 : mode === 'grid4x4' ? 4 : 3;
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <SquareGrid n={n} />
    </svg>
  );
}
