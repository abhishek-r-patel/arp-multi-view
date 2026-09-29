// Modal cheat sheet for the v2 keyboard shortcuts, opened with "?" and closed with Escape.
interface Props {
  onClose: () => void;
}

// Keep in sync with lib/useShortcuts.ts and the README shortcut table.
const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: '/', description: 'Jump to the search box' },
  { keys: '1 – 6', description: 'Set the number of columns' },
  { keys: 'M', description: 'Mute / unmute every YouTube stream' },
  { keys: 'F', description: 'Focus the hovered stream (and exit focus)' },
  { keys: 'C', description: 'Open or close chat for the hovered stream (several can stay open)' },
  { keys: 'S', description: 'Sync — restart playback on every YouTube stream' },
  { keys: '?', description: 'Show or hide this list' },
  { keys: 'Esc', description: 'Close this panel, close all chats, or leave focus mode' },
];

export function ShortcutsOverlay({ onClose }: Props) {
  return (
    <div className="v2-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={onClose}>
      <div className="v2-overlay__card" onClick={(event) => event.stopPropagation()}>
        <header className="v2-overlay__head">
          <h2>Keyboard shortcuts</h2>
          <button type="button" className="v2-icon" onClick={onClose} aria-label="Close shortcuts">
            ✕
          </button>
        </header>
        <dl className="v2-overlay__list">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys} className="v2-overlay__row">
              <dt>
                <kbd>{shortcut.keys}</kbd>
              </dt>
              <dd>{shortcut.description}</dd>
            </div>
          ))}
        </dl>
        <p className="v2-overlay__note">Shortcuts are ignored while you are typing in the search box.</p>
      </div>
    </div>
  );
}
