// One tile in the v2 collage: a glassy frame with a hover toolbar over the embedded player.
// Owns its own live-status and display-name lookups, plus grip-initiated drag reordering
// (the tile is only made draggable while the grip is held, so dragging inside the player
// — e.g. a YouTube seek bar — never starts a reorder).
import { useEffect, useRef, useState } from 'react';
import type { StreamSource } from '../../types';
import { providerOf } from '../../types';
import { fetchStreamNames, type ResolvedStreamNames } from '../../lib/streamTitle';
import { fetchLiveState, type LiveState } from '../lib/liveStatus';
import { YouTubePlayer } from '../../components/players/YouTubePlayer';
import { KickPlayer } from '../../components/players/KickPlayer';

const EMPTY_NAMES: ResolvedStreamNames = { videoName: null, channelName: null };
const LIVE_POLL_MS = 60_000;

interface Props {
  source: StreamSource;
  index: number;
  isActive: boolean;
  isFocused: boolean;
  isChatOpen: boolean;
  playSignal: number;
  quality: string;
  onActivate: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onToggleMute: (id: string) => void;
  onToggleFocus: (id: string) => void;
  onToggleChat: (id: string) => void;
  onLiveStateChange: (id: string, state: LiveState) => void;
}

export function CollageTile({
  source,
  index,
  isActive,
  isFocused,
  isChatOpen,
  playSignal,
  quality,
  onActivate,
  onRemove,
  onReorder,
  onToggleMute,
  onToggleFocus,
  onToggleChat,
  onLiveStateChange,
}: Props) {
  const tileRef = useRef<HTMLElement | null>(null);
  const [names, setNames] = useState<ResolvedStreamNames>(EMPTY_NAMES);
  const [live, setLive] = useState<LiveState>('unknown');
  const [dragArmed, setDragArmed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const provider = providerOf(source.target);

  useEffect(() => {
    let cancelled = false;
    setNames(EMPTY_NAMES);
    fetchStreamNames(source.target).then((resolved) => {
      if (!cancelled) {
        setNames(resolved);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source.target]);

  // Live status can flip while the collage is open, so it is re-checked on an interval and
  // reported upward for the header's "N live" counter.
  useEffect(() => {
    let cancelled = false;
    const check = () => {
      fetchLiveState(source.target).then((state) => {
        if (!cancelled) {
          setLive(state);
          onLiveStateChange(source.id, state);
        }
      });
    };
    check();
    const timer = setInterval(check, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // onLiveStateChange is a stable callback from AppV2; re-running on identity changes would
    // restart the poll on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.id, source.target]);

  const channel = names.channelName ?? source.label;
  const title = names.videoName;

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const draggedId = event.dataTransfer.getData('text/plain');
    if (draggedId) {
      onReorder(draggedId, source.id);
    }
  }

  return (
    <article
      ref={tileRef}
      className={[
        'v2-tile',
        isActive ? 'v2-tile--active' : '',
        isFocused ? 'v2-tile--focused' : '',
        isDragOver ? 'v2-tile--drag-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable={dragArmed}
      // Marks this as the tile the F / C shortcuts act on.
      onMouseEnter={() => onActivate(source.id)}
      onFocusCapture={() => onActivate(source.id)}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', source.id);
      }}
      onDragEnd={() => setDragArmed(false)}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <header className="v2-tile__bar">
        <button
          type="button"
          className="v2-grip"
          aria-label={`Drag to reorder ${channel}`}
          title="Drag to reorder"
          onMouseDown={() => setDragArmed(true)}
          onMouseUp={() => setDragArmed(false)}
        >
          <span aria-hidden="true">⠿</span>
        </button>

        <span className={`v2-badge v2-badge--${provider}`}>{provider === 'youtube' ? 'YT' : 'KICK'}</span>
        {live === 'live' && <span className="v2-badge v2-badge--live">LIVE</span>}
        {live === 'offline' && <span className="v2-badge v2-badge--offline">OFFLINE</span>}

        <span className="v2-tile__names" title={title ? `${channel} — ${title}` : channel}>
          <strong>{channel}</strong>
          {title && <em>{title}</em>}
        </span>

        <span className="v2-tile__index">{index + 1}</span>

        <span className="v2-tile__actions">
          {provider === 'youtube' && (
            <button
              type="button"
              className="v2-icon"
              aria-label={source.muted ? `Unmute ${channel}` : `Mute ${channel}`}
              title={source.muted ? 'Unmute' : 'Mute'}
              onClick={() => onToggleMute(source.id)}
            >
              {source.muted ? '🔇' : '🔊'}
            </button>
          )}
          <button
            type="button"
            className={`v2-icon${isChatOpen ? ' v2-icon--on' : ''}`}
            aria-label={`Toggle chat for ${channel}`}
            title="Chat (C)"
            onClick={() => onToggleChat(source.id)}
          >
            💬
          </button>
          <button
            type="button"
            className={`v2-icon${isFocused ? ' v2-icon--on' : ''}`}
            aria-label={isFocused ? `Exit focus on ${channel}` : `Focus ${channel}`}
            title="Focus (F)"
            onClick={() => onToggleFocus(source.id)}
          >
            ⤢
          </button>
          <button
            type="button"
            className="v2-icon"
            aria-label={`Fullscreen ${channel}`}
            title="Fullscreen"
            onClick={() => tileRef.current?.requestFullscreen?.()}
          >
            ⛶
          </button>
          <button
            type="button"
            className="v2-icon v2-icon--danger"
            aria-label={`Remove ${channel}`}
            title="Remove"
            onClick={() => onRemove(source.id)}
          >
            ✕
          </button>
        </span>
      </header>

      <div className="v2-tile__player">
        {source.target.kind === 'kick-channel' ? (
          <KickPlayer target={source.target} />
        ) : (
          <YouTubePlayer target={source.target} muted={source.muted} playSignal={playSignal} quality={quality} />
        )}
      </div>
    </article>
  );
}
