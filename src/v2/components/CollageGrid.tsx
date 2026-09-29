// The collage surface. In normal mode it is a CSS grid whose column count comes from the
// toolbar slider; in focus mode the focused stream fills the stage and the rest become a
// scrollable filmstrip beside it. Empty state doubles as the onboarding message.
import type { StreamSource } from '../../types';
import type { LiveState } from '../lib/liveStatus';
import { CollageTile } from './CollageTile';

interface Props {
  streams: StreamSource[];
  columns: number;
  activeId: string | null;
  focusedId: string | null;
  chatIds: string[];
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

export function CollageGrid({
  streams,
  columns,
  activeId,
  focusedId,
  chatIds,
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
  if (streams.length === 0) {
    return (
      <div className="v2-empty">
        <div className="v2-empty__ring" aria-hidden="true" />
        <h2>Your collage is empty</h2>
        <p>
          Search a Kick channel name above, or paste a YouTube / Kick link. Add up to 12 streams and watch them side by
          side.
        </p>
        <p className="v2-empty__hint">
          Press <kbd>/</kbd> to jump to search, <kbd>?</kbd> for all shortcuts.
        </p>
      </div>
    );
  }

  const isFocusMode = focusedId !== null && streams.some((s) => s.id === focusedId);
  const effectiveColumns = Math.min(columns, streams.length);

  const renderTile = (source: StreamSource, index: number) => (
    <CollageTile
      key={source.id}
      source={source}
      index={index}
      isActive={activeId === source.id}
      isFocused={focusedId === source.id}
      isChatOpen={chatIds.includes(source.id)}
      playSignal={playSignal}
      quality={quality}
      onActivate={onActivate}
      onRemove={onRemove}
      onReorder={onReorder}
      onToggleMute={onToggleMute}
      onToggleFocus={onToggleFocus}
      onToggleChat={onToggleChat}
      onLiveStateChange={onLiveStateChange}
    />
  );

  // Unlike v1's Spotlight, this branch moves tiles between parents, so changing focus remounts
  // the affected players. Acceptable for an explicit user action; don't reuse for frequent toggles.
  if (isFocusMode) {
    const focusedIndex = streams.findIndex((s) => s.id === focusedId);
    const rest = streams.filter((s) => s.id !== focusedId);
    return (
      <div className={`v2-focus${rest.length === 0 ? ' v2-focus--solo' : ''}`}>
        <div className="v2-focus__main">{renderTile(streams[focusedIndex], focusedIndex)}</div>
        {rest.length > 0 && (
          <div className="v2-focus__strip">
            {rest.map((source) => renderTile(source, streams.indexOf(source)))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="v2-grid" style={{ '--v2-cols': effectiveColumns } as React.CSSProperties}>
      {streams.map(renderTile)}
    </div>
  );
}
