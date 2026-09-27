# ARP Multi View

A local, personal dashboard for watching several YouTube and Kick streams on one screen at
once, instead of switching browser tabs. No account, hosted backend, or domain is required;
the local dev server serves the app, while your browser loads players and metadata directly
from YouTube and Kick (see "What's saved" below).

## Run it

```
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL.

## Project documentation

- [Local setup guide](docs/LOCAL-SETUP.md) — install prerequisites, run the app, and troubleshoot common issues.
- [Technical specification](docs/TECHNICAL-SPEC.md) — architecture, tooling, and source-file responsibilities.

## Adding streams

Paste one or more stream URLs into the box at the top (one per line, or comma-separated) and
click the **➕** button:

- **YouTube**: watch (`?v=...`), `youtu.be/...`, `/live/...`, `/shorts/...`, `/embed/...`, or
  `/channel/UC.../` URLs. `@handle` URLs aren't supported — paste the live video URL or a
  `/channel/UC...` URL instead (see Known limitations).
- **Kick**: a channel URL such as `https://kick.com/somechannel`. VOD links aren't embeddable,
  only the live channel.

Tile labels start with an ID/channel placeholder. The app then tries to look up the video or
live-stream title and channel name; use the toolbar's **🎬 / 👤** button to choose which to
show. Missing or unavailable names fall back to the placeholder (see Known limitations).

If a pasted line can't be parsed, an error explaining why is listed below the box — the other
valid lines are still added. A URL that's already in your grid is silently skipped instead of
adding a duplicate tile.

## Managing your list

The **Manage streams** panel (open by default — click its header to collapse it) lists every
stream as an editable row:

- **✓** — re-parses and updates that row's URL in place (e.g. to fix a typo or swap in a
  different video), keeping its mute state. Rejected if it duplicates another stream already
  in the grid.
- **🗑** — removes that stream.
- **⠿** (drag indicator) — drag a row to reorder it; the video grid reorders to match.
  Dragging a video tile in a grid layout updates this list too.

## Layouts

Pick a layout from the toolbar:

- **Auto grid** — arranges all tiles in a roughly square grid that grows/shrinks with the
  number of streams.
- **2 x 2** / **4 x 4** — fixed column counts.
- **Spotlight** — one enlarged "main" video plus the rest as a column of small side tiles
  (that column scrolls if there are more streams than fit on screen).

Reordering works differently per layout:

- In **Auto grid / 2x2 / 4x4**, drag any tile and drop it onto another to move it there
  (grab the tile's toolbar or border — dragging directly on the embedded video won't start a
  drag, since the video player captures the mouse there).
- In **Spotlight**, tile drag-and-drop is disabled; URL rows can still be dragged to reorder
  the list. Click the **⤢** button on a side tile's toolbar to make that stream the new main
  video without restarting its player.

## Per-tile controls

Each tile's toolbar has icon buttons (hover any of them for a tooltip):

- **🔊 / 🔇** — shows the tile's current state and toggles it on click: 🔊 means unmuted
  (click to mute), 🔇 means muted (click to unmute). YouTube tiles only — see the Kick note
  below.
- **⛶** — fullscreen that tile.
- **⤢** — (Spotlight side tiles only) make this the main video.
- **🗑** — remove that stream.

Toolbar-wide controls (top of the page):

- **🎬 / 👤** — switch all tile labels between video/live-stream titles and channel names;
  unavailable names use the placeholder label.
- **▶ Play all** — asks ready YouTube players to start; a player still loading may miss the
  click, and browser playback rules may still block sound. Kick playback uses its own controls.
- **🔇 / 🔊 Mute all / Unmute all** — mutes/unmutes every YouTube tile at once.
- **ℹ Help** (top-right corner) — opens the in-app usage guide; close it with **✕** or click
  outside the panel. Help is hidden while the grid is maximized.
- **Maximize video grid** (top-right corner) — hides the header/toolbar/manage-streams panel
  and expands the grid to fill the window. Click **Show controls** to bring them back.

## Themes

Three color themes — **Midnight**, **Ember**, **Aurora** — selectable from the toolbar.

## What's saved

Your stream list (including URL, order, and YouTube mute settings), chosen layout, spotlight
selection, theme, and title/channel display mode are saved to this browser's `localStorage` and
restored when you reopen the page at the same origin. There is no app backend or account sync.
Your browser does contact YouTube and Kick to load their player embeds and to request metadata;
those services may receive the URLs/IDs needed for playback or lookup. Browser settings that
block storage can prevent preferences from being saved.

## Known limitations

- Kick does not expose a documented API for parent-page mute/volume control, so Kick audio
  must be controlled using the player's own on-screen controls inside its tile, not the
  toolbar mute button.
- Browsers may require a real user click before a stream can play with sound; embeds request
  muted, non-autoplaying playback by default. Use each player's controls if needed.
- YouTube `@handle` URLs can't be resolved to a channel/video id client-side without the
  YouTube Data API (which needs an API key this client-only app doesn't use) — use the direct
  video/live URL or a `/channel/UC...` URL instead.
- Video and channel names are looked up best-effort from provider endpoints when a tile is
  added or its URL changes. If lookup fails (network issue, CORS, or provider restriction),
  the tile shows its placeholder. YouTube `/channel/UC...` live embeds do not resolve either
  name here; an offline Kick channel may not have a live-stream title.
- Corporate/school networks with content filtering (e.g. Zscaler) commonly block the
  "Video Streaming" category, which prevents both YouTube/Kick embeds and the title lookup
  above from loading. If streams (or titles) fail to load, try a different network.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`, and npm (the version range Vite 8 requires).

## Development

- `npm run lint` — runs [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules).
- `npm run build` — type-checks (`tsc -b`) and builds a production bundle with Vite.

