// Root component. Owns persisted app state (stream list, layout, spotlight selection, theme,
// title mode) via useLocalStorage, plus the handlers that mutate it. Renders the header/toolbar
// controls and the two content areas: ManageStreamsPanel (the editable URL list) and StreamGrid
// (the actual video tiles) — both driven from the same `streams` array, kept in sync by
// handleReorder.
import { useEffect, useState } from 'react';
import { parseStreamUrl, parseStreamUrls, type ParseFailure, type ParseSuccess } from './lib/parseStreamUrl';
import { useLocalStorage } from './lib/useLocalStorage';
import { ManageStreamsPanel } from './components/ManageStreamsPanel';
import { StreamGrid } from './components/StreamGrid';
import { HelpPanel } from './components/HelpPanel';
import { LayoutIcon } from './components/LayoutIcon';
import { navigate } from './router';
import type { LayoutMode, StreamSource, ThemeName, TitleMode } from './types';
import './App.css';

// Static option lists that drive the layout and theme picker buttons in the toolbar below.
const LAYOUTS: { value: LayoutMode; label: string }[] = [
  { value: 'auto', label: 'Auto grid' },
  { value: 'grid2x2', label: '2 x 2' },
  { value: 'grid4x4', label: '4 x 4' },
  { value: 'spotlight', label: 'Spotlight' },
];

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'midnight', label: 'Midnight' },
  { value: 'ember', label: 'Ember' },
  { value: 'aurora', label: 'Aurora' },
];

function App() {
  const [streams, setStreams] = useLocalStorage<StreamSource[]>('arp-multi-view:streams', []);
  const [layout, setLayout] = useLocalStorage<LayoutMode>('arp-multi-view:layout', 'auto');
  const [spotlightId, setSpotlightId] = useLocalStorage<string | null>('arp-multi-view:spotlight', null);
  const [theme, setTheme] = useLocalStorage<ThemeName>('arp-multi-view:theme', 'midnight');
  const [titleMode, setTitleMode] = useLocalStorage<TitleMode>('arp-multi-view:titleMode', 'channel');
  // Counter bumped by handlePlayAll; YouTubePlayer watches it to trigger playVideo() on every
  // YouTube tile (see YouTubePlayer.tsx's playSignal effect for why a real click is needed).
  const [playSignal, setPlaySignal] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Reflects the selected theme onto <html data-theme="...">, which index.css's
  // [data-theme='...'] selectors use to swap the CSS custom-property palette.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Parses one or more pasted URLs (AddStreamForm), appends any that parsed successfully and
  // aren't already in the grid (by exact URL match), and returns the failures so the form can
  // show a per-line error list. Called from ManageStreamsPanel -> AddStreamForm's onAdd.
  function handleAdd(rawText: string): ParseFailure[] {
    const results = parseStreamUrls(rawText);
    const failures = results.filter((r): r is ParseFailure => !r.ok);
    const additions = results
      .filter((r): r is ParseSuccess => r.ok)
      .map((r) => r.source)
      .filter((s) => !streams.some((existing) => existing.url === s.url));

    if (additions.length > 0) {
      setStreams([...streams, ...additions]);
    }
    return failures;
  }

  // Removes a stream by id, and clears the spotlight selection if the removed stream was
  // currently spotlighted (otherwise StreamGrid would fall back to the first remaining stream).
  function handleRemove(id: string) {
    setStreams(streams.filter((s) => s.id !== id));
    if (spotlightId === id) {
      setSpotlightId(null);
    }
  }

  // Re-parses an edited URL for an existing stream (from a ManageStreamsPanel row), replacing
  // its url/label/target in place while keeping its id and mute state. Returns an error string
  // for the row to display, or null on success. Rejects the edit if it duplicates another
  // stream already in the grid.
  function handleUpdateUrl(id: string, rawUrl: string): string | null {
    const result = parseStreamUrl(rawUrl);
    if (!result.ok) {
      return result.error;
    }
    if (streams.some((s) => s.id !== id && s.url === result.source.url)) {
      return 'That URL is already in the grid.';
    }
    setStreams(
      streams.map((s) =>
        s.id === id ? { ...s, url: result.source.url, label: result.source.label, target: result.source.target } : s,
      ),
    );
    return null;
  }

  // Moves the dragged stream to sit at the target stream's position in the list, shifting
  // everything between. Shared by both StreamGrid's tile drag-and-drop and ManageStreamsPanel's
  // row drag-and-drop, so dragging in either place reorders both (they render from this same array).
  function handleReorder(draggedId: string, targetId: string) {
    if (draggedId === targetId) {
      return;
    }
    const fromIndex = streams.findIndex((s) => s.id === draggedId);
    const toIndex = streams.findIndex((s) => s.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const next = [...streams];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setStreams(next);
  }

  // Flips one stream's muted flag (only meaningful for YouTube; Kick audio can only be
  // controlled from inside its own iframe, see KickPlayer.tsx).
  function handleToggleMute(id: string) {
    setStreams(streams.map((s) => (s.id === id ? { ...s, muted: !s.muted } : s)));
  }

  // Sets `muted` for every YouTube stream at once (the toolbar's Mute all/Unmute all buttons);
  // Kick streams are left untouched since we can't control their audio from here.
  function handleMuteAll(muted: boolean) {
    setStreams(streams.map((s) => (s.target.kind.startsWith('youtube') ? { ...s, muted } : s)));
  }

  // Bumps playSignal so ready YouTubePlayer instances attempt playVideo(). Playback with
  // sound still depends on browser autoplay rules and each player's readiness.
  function handlePlayAll() {
    setPlaySignal((signal) => signal + 1);
  }

  return (
    <div className={`app${isMaximized ? ' app--maximized' : ''}`}>
      <div className="app__corner-controls">
        {!isMaximized && (
          <>
            <button
              type="button"
              className="icon-btn"
              aria-label="Back to version picker"
              title="Back to version picker"
              onClick={() => navigate('/')}
            >
              ←
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Help"
              title="How to use ARP Multi View"
              onClick={() => setShowHelp(true)}
            >
              ℹ
            </button>
          </>
        )}
        <button
          type="button"
          className="maximize-toggle"
          onClick={() => {
            setIsMaximized((value) => !value);
            setShowHelp(false);
          }}
        >
          {isMaximized ? 'Show controls' : 'Maximize video grid'}
        </button>
      </div>

      {showHelp && !isMaximized && <HelpPanel onClose={() => setShowHelp(false)} />}

      <div className="app__controls">
        <header className="app__header">
          <h1>ARP Multi View</h1>
          <p>Watch several YouTube and Kick streams on one screen.</p>
        </header>

        <ManageStreamsPanel
          streams={streams}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onUpdateUrl={handleUpdateUrl}
          onReorder={handleReorder}
        />

        <div className="app__toolbar">
          <div className="layout-switch">
            <span className="toolbar-group__label">Layouts</span>
            <div className="toolbar-group__row">
              {LAYOUTS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={layout === option.value ? 'active' : ''}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setLayout(option.value)}
                >
                  <LayoutIcon mode={option.value} />
                </button>
              ))}
            </div>
          </div>
          <div className="theme-switch">
            <span className="toolbar-group__label">Themes</span>
            <div className="toolbar-group__row">
              {THEMES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={theme === option.value ? 'active' : ''}
                  onClick={() => setTheme(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="action-switch">
            <span className="toolbar-group__label">Actions</span>
            <div className="toolbar-group__row">
              <button
                type="button"
                className="icon-btn"
                aria-label={titleMode === 'video' ? 'Showing video titles — click to show channel names' : 'Showing channel names — click to show video titles'}
                title={titleMode === 'video' ? 'Showing video titles (click for channel names)' : 'Showing channel names (click for video titles)'}
                onClick={() => setTitleMode(titleMode === 'video' ? 'channel' : 'video')}
              >
                {titleMode === 'video' ? '🎬' : '👤'}
              </button>
              <button type="button" className="icon-btn" aria-label="Play all YouTube" title="Play all YouTube" onClick={handlePlayAll}>
                ▶
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Mute all YouTube"
                title="Mute all YouTube"
                onClick={() => handleMuteAll(true)}
              >
                🔇
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label="Unmute all YouTube"
                title="Unmute all YouTube"
                onClick={() => handleMuteAll(false)}
              >
                🔊
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="app__stage">
        <StreamGrid
          streams={streams}
          layout={layout}
          spotlightId={spotlightId}
          titleMode={titleMode}
          playSignal={playSignal}
          onRemove={handleRemove}
          onReorder={handleReorder}
          onToggleMute={handleToggleMute}
          onSetSpotlight={setSpotlightId}
        />
      </div>
    </div>
  );
}

export default App;
