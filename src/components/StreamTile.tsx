// Renders one stream's toolbar (provider icon, resolved title, mute/fullscreen/spotlight-switch/
// remove buttons) and its embedded player (YouTubePlayer or KickPlayer, chosen by target.kind).
// Also owns grid-only tile dragging and best-effort video/channel name lookup.
import { useEffect, useRef, useState } from 'react';
import type { StreamSource, TitleMode } from '../types';
import { providerOf } from '../types';
import { fetchStreamNames, type ResolvedStreamNames } from '../lib/streamTitle';
import { ProviderIcon } from './ProviderIcon';
import { YouTubePlayer } from './players/YouTubePlayer';
import { KickPlayer } from './players/KickPlayer';

const EMPTY_NAMES: ResolvedStreamNames = { videoName: null, channelName: null };

interface Props {
  source: StreamSource;
  isSpotlight: boolean;
  spotlightEnabled: boolean;
  titleMode: TitleMode;
  playSignal: number;
  onRemove: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onToggleMute: (id: string) => void;
  onSetSpotlight: (id: string) => void;
}

export function StreamTile({
  source,
  isSpotlight,
  spotlightEnabled,
  titleMode,
  playSignal,
  onRemove,
  onReorder,
  onToggleMute,
  onSetSpotlight,
}: Props) {
  const tileRef = useRef<HTMLDivElement | null>(null);
  const provider = providerOf(source.target);
  const [resolvedNames, setResolvedNames] = useState<ResolvedStreamNames>(EMPTY_NAMES);
  const [lastTarget, setLastTarget] = useState(source.target);
  const [isDragOver, setIsDragOver] = useState(false);

  // Resets the resolved names back to "unknown" whenever this tile's target changes (e.g. the
  // URL was edited to a different video). Deliberately done during render (React's documented
  // "adjust state when a prop changes" pattern) rather than in a useEffect, so the stale name
  // never flashes on screen even for a single frame.
  if (source.target !== lastTarget) {
    setLastTarget(source.target);
    setResolvedNames(EMPTY_NAMES);
  }

  // Fires the best-effort name lookup whenever the target changes; `cancelled` prevents a
  // slow, now-stale request from overwriting the names after the target has changed again.
  useEffect(() => {
    let cancelled = false;
    fetchStreamNames(source.target).then((resolved) => {
      if (!cancelled) {
        setResolvedNames(resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source.target]);

  const preferredName = titleMode === 'channel' ? resolvedNames.channelName : resolvedNames.videoName;
  const title = preferredName ?? source.label;
  const canSwitchToSpotlight = spotlightEnabled && !isSpotlight;
  // Reordering is only meaningful in the plain grid layouts; Spotlight uses the switch button instead.
  const isDraggable = !spotlightEnabled;

  function handleFullscreen() {
    tileRef.current?.requestFullscreen?.();
  }

  // Stashes this tile's stream id in the native drag payload so the drop target can identify
  // which stream was dragged (read back out in handleDrop, on whichever tile it's dropped on).
  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', source.id);
  }

  // Must call preventDefault() for the browser to treat this tile as a valid drop target.
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  // Reads the dragged stream's id back out and asks App (via onReorder) to move it to this tile's position.
  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const draggedId = event.dataTransfer.getData('text/plain');
    if (draggedId) {
      onReorder(draggedId, source.id);
    }
  }

  return (
    <div
      className={`stream-tile${isSpotlight ? ' stream-tile--spotlight' : ''}${isDragOver ? ' stream-tile--drag-over' : ''}${isDraggable ? ' stream-tile--draggable' : ''}`}
      ref={tileRef}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragOver={isDraggable ? handleDragOver : undefined}
      onDragEnter={isDraggable ? () => setIsDragOver(true) : undefined}
      onDragLeave={isDraggable ? () => setIsDragOver(false) : undefined}
      onDrop={isDraggable ? handleDrop : undefined}
    >
      <div className="stream-tile__toolbar">
        <ProviderIcon provider={provider} />
        <span className="stream-tile__label" title={source.url}>
          {title}
        </span>
        <div className="stream-tile__actions">
          {provider === 'youtube' && (
            <button
              type="button"
              className="icon-btn"
              aria-label={source.muted ? 'Unmute' : 'Mute'}
              title={source.muted ? 'Unmute' : 'Mute'}
              onClick={() => onToggleMute(source.id)}
            >
              {source.muted ? '🔇' : '🔊'}
            </button>
          )}
          <button type="button" className="icon-btn" aria-label="Fullscreen" title="Fullscreen" onClick={handleFullscreen}>
            ⛶
          </button>
          {canSwitchToSpotlight && (
            <button
              type="button"
              className="icon-btn"
              aria-label={`Switch spotlight to ${title}`}
              title="Make this the main video"
              onClick={() => onSetSpotlight(source.id)}
            >
              ⤢
            </button>
          )}
          <button
            type="button"
            className="icon-btn icon-btn--remove"
            aria-label="Remove stream"
            title="Remove"
            onClick={() => onRemove(source.id)}
          >
            🗑
          </button>
        </div>
      </div>
      <div className="stream-tile__player">
        {source.target.kind === 'youtube-video' || source.target.kind === 'youtube-channel' ? (
          <YouTubePlayer target={source.target} muted={source.muted} playSignal={playSignal} />
        ) : (
          <KickPlayer target={source.target} />
        )}
      </div>
      {provider === 'kick' && <p className="stream-tile__hint">Use the player's own controls to unmute.</p>}
    </div>
  );
}
