// Pure CSS-generation helpers for the two grid layout systems (the plain auto/2x2/4x4 grid,
// and the Spotlight main+side grid). Kept as plain functions, separate from components, so the
// sizing math has no React/DOM dependency and is easy to reason about or unit-test in isolation.
import type { CSSProperties } from 'react';
import type { LayoutMode } from '../types';

// Returns the `gridTemplateColumns` for the plain (non-Spotlight) grid: fixed 2 or 4 columns for
// the 2x2/4x4 modes, or a column count that grows with the stream count (ceil(sqrt(n))) for 'auto'
// so the grid stays roughly square as streams are added/removed.
export function computeGridStyle(mode: LayoutMode, count: number): CSSProperties {
  if (count === 0) {
    return {};
  }
  if (mode === 'grid2x2') {
    return { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' };
  }
  if (mode === 'grid4x4') {
    return { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' };
  }
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  return { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
}

// Returns the `gridTemplateRows` for the Spotlight layout's single shared grid container
// (see StreamGrid.tsx). One explicit row is reserved per side tile; the main tile's CSS then
// spans `grid-row: 1 / -1` to fill the full height. The row count must be explicit (not
// `grid-auto-rows`) because `-1` only resolves against the grid's EXPLICITLY defined last line.
export function computeSpotlightGridStyle(sideCount: number): CSSProperties {
  return { gridTemplateRows: `repeat(${Math.max(sideCount, 1)}, minmax(140px, 1fr))` };
}
