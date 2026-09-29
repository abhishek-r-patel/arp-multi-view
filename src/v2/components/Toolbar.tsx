// Sticky control strip above the collage: stream/live counters, column slider, global sound and
// quality controls, sync, share and clear.
interface Props {
  streamCount: number;
  maxStreams: number;
  liveCount: number;
  columns: number;
  soundOn: boolean;
  quality: string;
  shareLabel: string;
  onColumnsChange: (columns: number) => void;
  onToggleSound: () => void;
  onQualityChange: (quality: string) => void;
  onSync: () => void;
  onShare: () => void;
  onClear: () => void;
  onShowShortcuts: () => void;
}

// `value` must be one of YouTube's own suggested-quality tokens, not a made-up label.
const QUALITIES: { value: string; label: string }[] = [
  { value: 'default', label: 'Auto' },
  { value: 'hd1080', label: '1080p' },
  { value: 'hd720', label: '720p' },
  { value: 'large', label: '480p' },
  { value: 'medium', label: '360p' },
  { value: 'small', label: '240p' },
];

export function Toolbar({
  streamCount,
  maxStreams,
  liveCount,
  columns,
  soundOn,
  quality,
  shareLabel,
  onColumnsChange,
  onToggleSound,
  onQualityChange,
  onSync,
  onShare,
  onClear,
  onShowShortcuts,
}: Props) {
  return (
    <div className="v2-toolbar">
      <div className="v2-toolbar__stats">
        <span className="v2-stat">
          <strong>{streamCount}</strong>/{maxStreams} streams
        </span>
        <span className="v2-stat v2-stat--live">
          <i className="v2-dot" aria-hidden="true" />
          <strong>{liveCount}</strong> live
        </span>
      </div>

      <label className="v2-columns">
        <span className="v2-columns__label">Columns</span>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={columns}
          onChange={(event) => onColumnsChange(Number(event.target.value))}
          aria-label="Number of columns"
        />
        <span className="v2-columns__value">{columns}</span>
      </label>

      <div className="v2-toolbar__actions">
        <button
          type="button"
          className={`v2-pill${soundOn ? ' v2-pill--on' : ''}`}
          onClick={onToggleSound}
          title="Mute / unmute all YouTube streams (M)"
        >
          {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
        </button>

        <label className="v2-pill v2-pill--select">
          <span>Quality</span>
          <select value={quality} onChange={(event) => onQualityChange(event.target.value)} aria-label="Playback quality">
            {QUALITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="v2-pill" onClick={onSync} title="Restart playback on every YouTube stream (S)">
          ⟳ Sync
        </button>
        <button type="button" className="v2-pill" onClick={onShare} title="Copy a link to this collage">
          {shareLabel}
        </button>
        <button type="button" className="v2-pill" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
          ⌨ Shortcuts
        </button>
        <button type="button" className="v2-pill v2-pill--danger" onClick={onClear} disabled={streamCount === 0} title="Remove every stream">
          Clear
        </button>
      </div>
    </div>
  );
}
