// Version 2 root. Same purpose as v1 — many YouTube/Kick streams on one screen — but built
// around a "collage" of up to 12 streams with smart search, a column slider, per-stream chat,
// global sound/quality controls, keyboard shortcuts and shareable links.
//
// Collage state is persisted under its own localStorage keys so v1 and v2 never overwrite each
// other's saved layout.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { StreamSource } from '../types';
import { useLocalStorage } from '../lib/useLocalStorage';
import { navigate } from '../router';
import { CommandBar } from './components/CommandBar';
import { Toolbar } from './components/Toolbar';
import { CollageGrid } from './components/CollageGrid';
import { ChatPanel } from './components/ChatPanel';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { buildShareUrl, readSharedCollage } from './lib/shareLink';
import type { LiveState } from './lib/liveStatus';
import { useShortcuts } from './lib/useShortcuts';
import './v2.css';

const MAX_STREAMS = 12;

export function AppV2() {
  const [streams, setStreams] = useLocalStorage<StreamSource[]>('arp-multi-view:v2:streams', []);
  const [columns, setColumns] = useLocalStorage<number>('arp-multi-view:v2:columns', 2);
  const [quality, setQuality] = useLocalStorage<string>('arp-multi-view:v2:quality', 'default');
  const [soundOn, setSoundOn] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [playSignal, setPlaySignal] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shareLabel, setShareLabel] = useState('🔗 Share');
  const [liveStates, setLiveStates] = useState<Record<string, LiveState>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // A "?s=..." link replaces the saved collage once on load, then the query string is dropped so
  // a later refresh does not keep re-applying someone else's layout over local edits.
  useEffect(() => {
    const shared = readSharedCollage(window.location.search);
    if (!shared) {
      return;
    }
    setStreams(shared.streams);
    if (shared.columns !== null) {
      setColumns(shared.columns);
    }
    window.history.replaceState({}, '', '/v2');
    // Runs once on mount; the setters are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveCount = useMemo(
    () => streams.filter((s) => liveStates[s.id] === 'live').length,
    [streams, liveStates],
  );

  // The tile a shortcut applies to: whatever is hovered/focused, falling back to the first tile.
  const targetId = activeId && streams.some((s) => s.id === activeId) ? activeId : streams[0]?.id ?? null;

  // Must stay referentially stable: CollageTile keys its live-status polling interval to it.
  const handleLiveStateChange = useCallback((id: string, state: LiveState) => {
    setLiveStates((current) => (current[id] === state ? current : { ...current, [id]: state }));
  }, []);

  // New tiles inherit the current global sound state so one stream can't be unexpectedly loud.
  function handleAdd(source: StreamSource) {
    setStreams((current) => {
      if (current.length >= MAX_STREAMS || current.some((s) => s.url === source.url)) {
        return current;
      }
      return [...current, { ...source, muted: !soundOn }];
    });
  }

  function handleRemove(id: string) {
    setStreams((current) => current.filter((s) => s.id !== id));
    setFocusedId((current) => (current === id ? null : current));
    setChatIds((current) => current.filter((chatId) => chatId !== id));
    setActiveId((current) => (current === id ? null : current));
  }

  function handleReorder(draggedId: string, targetStreamId: string) {
    if (draggedId === targetStreamId) {
      return;
    }
    setStreams((current) => {
      const fromIndex = current.findIndex((s) => s.id === draggedId);
      const toIndex = current.findIndex((s) => s.id === targetStreamId);
      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleToggleMute(id: string) {
    setStreams((current) => current.map((s) => (s.id === id ? { ...s, muted: !s.muted } : s)));
  }

  // Global sound switch. Only YouTube tiles can be driven from here — Kick's embed exposes no
  // parent-page audio control, so those keep using the player's own volume button.
  function handleToggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setStreams((current) =>
      current.map((s) => (s.target.kind.startsWith('youtube') ? { ...s, muted: !next } : s)),
    );
  }

  function handleToggleFocus(id: string | null) {
    if (!id) {
      return;
    }
    setFocusedId((current) => (current === id ? null : id));
  }

  // Chats stack in the right-hand rail rather than replacing each other, so several live
  // channels can be followed at the same time.
  function handleToggleChat(id: string | null) {
    if (!id) {
      return;
    }
    setChatIds((current) => (current.includes(id) ? current.filter((chatId) => chatId !== id) : [...current, id]));
  }

  async function handleShare() {
    const url = buildShareUrl(streams, columns);
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('✓ Link copied');
    } catch {
      // Clipboard access can be denied (permissions, insecure context): fall back to the URL bar.
      window.history.replaceState({}, '', url.replace(window.location.origin, ''));
      setShareLabel('↑ Link in address bar');
    }
    setTimeout(() => setShareLabel('🔗 Share'), 2500);
  }

  function handleClear() {
    setStreams([]);
    setFocusedId(null);
    setChatIds([]);
    setActiveId(null);
    setLiveStates({});
  }

  useShortcuts({
    toggleSound: handleToggleSound,
    toggleFocus: () => handleToggleFocus(targetId),
    toggleChat: () => handleToggleChat(targetId),
    sync: () => setPlaySignal((signal) => signal + 1),
    setColumns: (value) => setColumns(value),
    toggleShortcuts: () => setShowShortcuts((value) => !value),
    focusSearch: () => searchInputRef.current?.focus(),
    escape: () => {
      if (showShortcuts) {
        setShowShortcuts(false);
        return;
      }
      if (chatIds.length > 0) {
        setChatIds([]);
        return;
      }
      setFocusedId(null);
    },
  });

  const chatStreams = streams.filter((s) => chatIds.includes(s.id));

  return (
    <div className={`v2${chatStreams.length > 0 ? ' v2--chat-open' : ''}`}>
      <div className="v2__aurora" aria-hidden="true" />

      <header className="v2-header">
        <div className="v2-header__brand">
          <button type="button" className="v2-back" onClick={() => navigate('/')} title="Back to version picker">
            ←
          </button>
          <div>
            <p className="v2-header__eyebrow">ARP Multi View</p>
            <h1 className="v2-header__title">Collage</h1>
          </div>
          <span className="v2-header__version">v2</span>
        </div>

        <CommandBar inputRef={searchInputRef} disabled={streams.length >= MAX_STREAMS} onAdd={handleAdd} />
      </header>

      <Toolbar
        streamCount={streams.length}
        maxStreams={MAX_STREAMS}
        liveCount={liveCount}
        columns={columns}
        soundOn={soundOn}
        quality={quality}
        shareLabel={shareLabel}
        onColumnsChange={setColumns}
        onToggleSound={handleToggleSound}
        onQualityChange={setQuality}
        onSync={() => setPlaySignal((signal) => signal + 1)}
        onShare={handleShare}
        onClear={handleClear}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <main className="v2-stage">
        <CollageGrid
          streams={streams}
          columns={columns}
          activeId={targetId}
          focusedId={focusedId}
          chatIds={chatIds}
          playSignal={playSignal}
          quality={quality}
          onActivate={setActiveId}
          onRemove={handleRemove}
          onReorder={handleReorder}
          onToggleMute={handleToggleMute}
          onToggleFocus={handleToggleFocus}
          onToggleChat={handleToggleChat}
          onLiveStateChange={handleLiveStateChange}
        />
        {chatStreams.length > 0 && (
          <aside className="v2-chat-rail">
            {chatStreams.map((source) => (
              <ChatPanel key={source.id} source={source} onClose={() => handleToggleChat(source.id)} />
            ))}
            <p className="v2-chat-rail__note">
              A chat only appears while that stream is actually live. If a panel stays blank, your network is blocking
              the provider's embedded chat — use ↗ to open it in a tab.
            </p>
          </aside>
        )}
      </main>

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
