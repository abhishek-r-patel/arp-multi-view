// Renders the video tiles for the currently selected layout mode: either a plain CSS grid
// (auto/2x2/4x4) or the Spotlight grid (one enlarged "main" tile plus small side tiles).
//
// IMPORTANT: within each layout, tiles are siblings in one flat list/container, rather than
// nested under separate "main" and "side" wrappers. If switching which stream is
// spotlighted moved a tile between two different parent DOM nodes, React would fully unmount
// and remount that tile (and its embedded YouTubePlayer/KickPlayer), reloading the video and
// losing playback state. Keeping one stable parent within Spotlight means switching its
// main tile only changes CSS classes/props; changing layout can still remount the players.
import type { LayoutMode, StreamSource, TitleMode } from '../types';
import { computeGridStyle, computeSpotlightGridStyle } from '../lib/layout';
import { StreamTile } from './StreamTile';

interface Props {
  streams: StreamSource[];
  layout: LayoutMode;
  spotlightId: string | null;
  titleMode: TitleMode;
  playSignal: number;
  onRemove: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onToggleMute: (id: string) => void;
  onSetSpotlight: (id: string) => void;
}

export function StreamGrid({
  streams,
  layout,
  spotlightId,
  titleMode,
  playSignal,
  onRemove,
  onReorder,
  onToggleMute,
  onSetSpotlight,
}: Props) {
  if (streams.length === 0) {
    return (
      <div className="stream-grid-empty">
        <p>No streams yet. Paste one or more YouTube / Kick URLs above to get started.</p>
      </div>
    );
  }

  // Shared tile callbacks; Spotlight disables tile dragging and offers a main-video switch
  // instead, while mute and remove still work across layouts.
  const tileProps = (source: StreamSource) => ({
    source,
    spotlightEnabled: layout === 'spotlight',
    titleMode,
    playSignal,
    onRemove,
    onReorder,
    onToggleMute,
    onSetSpotlight,
  });

  if (layout === 'spotlight') {
    // Falls back to the first stream if there's no spotlight selection yet, or the previously
    // spotlighted stream was removed.
    const mainId = spotlightId && streams.some((s) => s.id === spotlightId) ? spotlightId : streams[0].id;

    return (
      <div className="spotlight-layout" style={computeSpotlightGridStyle(streams.length - 1)}>
        {streams.map((source) => (
          <div key={source.id} className={`spotlight-item${source.id === mainId ? ' spotlight-item--main' : ''}`}>
            <StreamTile {...tileProps(source)} isSpotlight={source.id === mainId} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stream-grid" style={computeGridStyle(layout, streams.length)}>
      {streams.map((source) => (
        <StreamTile key={source.id} {...tileProps(source)} isSpotlight={false} />
      ))}
    </div>
  );
}
