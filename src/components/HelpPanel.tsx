// In-app "how to use this" reference, opened from the Help icon next to the maximize toggle.
// A curated, end-user-facing subset of README.md's content (skips dev-only sections like
// npm install/Node version), so instructions are available without leaving the app.
interface Props {
  onClose: () => void;
}

export function HelpPanel({ onClose }: Props) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-panel" onClick={(event) => event.stopPropagation()}>
        <div className="help-panel__header">
          <h2>How to use ARP Multi View</h2>
          <button type="button" className="icon-btn" aria-label="Close help" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="help-panel__body">
          <section>
            <h3>Adding streams</h3>
            <p>
              Paste one or more stream URLs into the box (one per line, or comma-separated) and click <strong>➕</strong>.
            </p>
            <ul>
              <li>
                <strong>YouTube</strong>: watch (<code>?v=...</code>), <code>youtu.be/...</code>, <code>/live/...</code>,{' '}
                <code>/shorts/...</code>, <code>/embed/...</code>, or <code>/channel/UC.../</code> URLs.{' '}
                <code>@handle</code> URLs aren't supported — paste the live video URL or a <code>/channel/UC...</code>{' '}
                URL instead.
              </li>
              <li>
                <strong>Kick</strong>: a channel URL such as <code>https://kick.com/somechannel</code>. VOD links
                aren't embeddable, only the live channel.
              </li>
            </ul>
            <p>
              Tile labels start with an ID/channel placeholder. Available video or live-stream titles and channel
              names are looked up automatically; missing names keep the placeholder. Unparseable lines show an error
              below the box; other valid lines are still added. A URL already in your grid is silently skipped.
            </p>
          </section>

          <section>
            <h3>Managing your list</h3>
            <p>The "Manage streams" panel (open by default) lists every stream as an editable row:</p>
            <ul>
              <li>
                <strong>✓</strong> — updates that row's URL in place (rejected if it duplicates another stream).
              </li>
              <li>
                <strong>🗑</strong> — removes that stream.
              </li>
              <li>
                <strong>⠿</strong> (drag indicator) — drag a row to reorder it; the video grid reorders to match.
                Dragging tiles in a grid layout also updates this list.
              </li>
            </ul>
          </section>

          <section>
            <h3>Layouts</h3>
            <ul>
              <li>
                <strong>Auto grid</strong> — a roughly square grid that grows/shrinks with the number of streams.
              </li>
              <li>
                <strong>2 x 2</strong> / <strong>4 x 4</strong> — fixed column counts.
              </li>
              <li>
                <strong>Spotlight</strong> — one enlarged main video plus the rest as a small, scrollable side column.
              </li>
            </ul>
            <p>
              In <strong>Auto grid / 2x2 / 4x4</strong>, drag any tile onto another to move it there (grab the
              toolbar/border, not the video itself). In <strong>Spotlight</strong>, tile dragging is disabled, but
              URL rows can still be reordered. Click a side tile's <strong>⤢</strong> button to make it the main
              video without restarting its player.
            </p>
          </section>

          <section>
            <h3>Per-tile controls</h3>
            <ul>
              <li>
                <strong>🔊 / 🔇</strong> — current mute state, click to toggle (YouTube only).
              </li>
              <li>
                <strong>⛶</strong> — fullscreen that tile.
              </li>
              <li>
                <strong>⤢</strong> — (Spotlight side tiles only) make this the main video.
              </li>
              <li>
                <strong>🗑</strong> — remove that stream.
              </li>
            </ul>
          </section>

          <section>
            <h3>Toolbar-wide controls</h3>
            <ul>
              <li>
                <strong>🎬 / 👤</strong> — show video/live-stream titles or channel names on tiles; unavailable
                names keep the placeholder.
              </li>
              <li>
                <strong>▶ Play all</strong> — asks ready YouTube players to start; loading players may miss the click
                and browser rules can still block sound.
              </li>
              <li>
                <strong>🔇 / 🔊 Mute all / Unmute all</strong> — affects every YouTube tile at once.
              </li>
              <li>
                <strong>ℹ Help</strong> — opens this guide; close with <strong>✕</strong> or click outside. It is
                hidden while the grid is maximized.
              </li>
              <li>
                <strong>Maximize video grid / Show controls</strong> — hides or restores the header/toolbar/manage
                panel so the grid fills the window.
              </li>
            </ul>
          </section>

          <section>
            <h3>Themes &amp; persistence</h3>
            <p>
              Three color themes (Midnight, Ember, Aurora) are selectable from the toolbar. Your stream list, layout,
              spotlight selection, theme, and title/channel mode are saved in this browser's localStorage. There is
              no app backend; the browser contacts YouTube and Kick for embeds and name lookups.
            </p>
          </section>

          <section>
            <h3>Known limitations</h3>
            <ul>
              <li>Kick audio/playback must be controlled from the player's own on-screen controls, not the toolbar.</li>
              <li>Embeds request muted, non-autoplaying playback; browsers may require a real click for sound.</li>
              <li>YouTube @handle URLs aren't supported (needs the YouTube Data API).</li>
              <li>Name lookups are best-effort. YouTube channel live embeds have no name lookup here.</li>
              <li>Networks that block "Video Streaming" traffic will prevent embeds and title lookups from loading.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
