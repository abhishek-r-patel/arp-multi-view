# ARP Multi View

A local, personal dashboard for watching several YouTube and Kick streams on one screen at
once, instead of switching browser tabs. No account, hosted backend, or domain is required;
the local dev server serves the app, while your browser loads players and metadata directly
from YouTube and Kick (see "What's saved" below).

The app ships **two versions** of the same idea. They share the URL parsing, the players, and
the metadata lookup, but have completely separate interfaces and separate saved layouts.

## Run it

```
npm install
npm run dev
```

Open the printed `http://localhost:5173` URL.

## Versions

| Route | Version | What it is |
|---|---|---|
| `/`   | Picker | Landing page — choose which version to open. |
| `/v1` | Classic grid | Paste URLs into a managed list; auto / 2x2 / 4x4 / spotlight layouts; three colour themes. |
| `/v2` | Collage | Search-driven, up to 12 streams, column slider, chat rail, quality/sound controls, keyboard shortcuts, shareable links. |

Both versions keep their own `localStorage` entries, so building a collage in `/v2` never
disturbs your `/v1` grid. Use the **←** button in either version's top-left corner to return
to the picker.

## Project documentation

- [Local setup guide](docs/LOCAL-SETUP.md) — install prerequisites, run the app, and troubleshoot common issues.
- [Technical specification](docs/TECHNICAL-SPEC.md) — architecture, tooling, and source-file responsibilities.
- [Repository instructions](.github/copilot-instructions.md) — rules every contributor (human or AI) follows when changing this repo.

## Version 2 — Collage (`/v2`)

### Adding streams to the collage

Type into the search box at the top:

- **A Kick channel name** — "trainwreckstv", "xQc", or anything close to it. The app resolves
  the real channel and shows whether it is live right now. Press **Enter** to add the top
  match, or click a result.
- **Any YouTube or Kick link** — the same URL formats version 1 accepts (see below). A pasted
  link is added directly.
- **A raw YouTube video ID or `UC...` channel ID** — also recognized.

YouTube channel *names* cannot be searched: that needs the YouTube Data API and an API key
this client-only app doesn't use. Paste the live video or `/channel/UC...` link instead.

The collage holds a maximum of **12 streams**; the search box disables itself when full.

### Arranging the collage

- **Columns slider** (or keys **1**–**6**) sets how many tiles sit side by side.
- **⠿ grip** — drag a tile by its grip and drop it on another to reorder. Dragging only starts
  from the grip, so dragging inside a player never moves tiles.
- **⤢ Focus** (or **F**) — enlarges one stream to fill the stage and moves the rest into a
  filmstrip beside it. Press **F** again or **Esc** to leave.
- **⛶** — fullscreen a single tile.
- **✕** — remove a tile.

### Chat

Press **💬** on a tile (or **C** for the hovered tile) to open that stream's chat in the
right-hand rail. Chats **stack** — open as many as you like and the rail scrolls. **Esc**
closes them all.

A chat only renders while that stream is genuinely live; YouTube shows "Chat is disabled for
this live stream" for anything else. Use the **↗** button in a chat's header to open it in a
normal tab if the embedded frame is blocked (see Known limitations).

### Global controls

- **Sound on / off** (or **M**) — mutes/unmutes every YouTube stream at once. Kick audio must
  be controlled from inside its own player.
- **Quality** — suggests a playback quality (Auto, 1080p … 240p) to every YouTube player.
  YouTube ignores the hint if the stream has no such rendition.
- **⟳ Sync** (or **S**) — asks every ready YouTube player to start playing.
- **🔗 Share** — copies a link that reproduces the current collage and column count. If
  clipboard access is blocked, the link is placed in the address bar instead.
- **Clear** — removes every stream.
- The header shows **N/12 streams** and how many are confirmed **live**.

### Keyboard shortcuts

Press **?** in the app for the same list. Shortcuts are ignored while you are typing in the
search box.

| Key | Action |
|---|---|
| `/` | Jump to the search box |
| `1`–`6` | Set the number of columns |
| `M` | Mute / unmute every YouTube stream |
| `F` | Focus the hovered stream (and exit focus) |
| `C` | Open or close chat for the hovered stream |
| `S` | Sync — restart playback on every YouTube stream |
| `?` | Show or hide the shortcut list |
| `Esc` | Close the shortcut panel, close all chats, or leave focus mode |

## Version 1 — Classic grid (`/v1`)

### Adding streams

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

### Managing your list

The **Manage streams** panel (open by default — click its header to collapse it) lists every
stream as an editable row:

- **✓** — re-parses and updates that row's URL in place (e.g. to fix a typo or swap in a
  different video), keeping its mute state. Rejected if it duplicates another stream already
  in the grid.
- **🗑** — removes that stream.
- **⠿** (drag indicator) — drag a row to reorder it; the video grid reorders to match.
  Dragging a video tile in a grid layout updates this list too.

### Layouts

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

### Per-tile controls

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
- **←** (top-right corner) — returns to the version picker.

### Themes

Three color themes — **Midnight**, **Ember**, **Aurora** — selectable from the toolbar.
They apply to version 1 only; version 2 has a single fixed dark theme.

## What's saved

Each version saves to this browser's `localStorage` under its own keys and restores it when
you reopen the page at the same origin:

- **Version 1** — stream list (URL, order, YouTube mute settings), layout, spotlight
  selection, theme, and title/channel display mode.
- **Version 2** — collage stream list, column count, and quality setting. Which chats are
  open, which tile is focused, and the sound toggle are per-session and reset on reload.

There is no app backend or account sync. Your browser does contact YouTube and Kick to load
their player embeds, chat frames, and metadata; those services may receive the URLs/IDs needed
for playback or lookup. Browser settings that block storage can prevent preferences from being
saved.

Opening a **shared `/v2` link** replaces the saved collage with the one in the link, then
drops the query string so a later refresh keeps your own edits.

## Known limitations

- Kick does not expose a documented API for parent-page mute/volume control, so Kick audio
  must be controlled using the player's own on-screen controls inside its tile, not the
  version 1 toolbar mute button or the version 2 sound toggle.
- Browsers may require a real user click before a stream can play with sound; embeds request
  muted, non-autoplaying playback by default. Use each player's controls if needed.
- YouTube `@handle` URLs can't be resolved to a channel/video id client-side without the
  YouTube Data API (which needs an API key this client-only app doesn't use) — use the direct
  video/live URL or a `/channel/UC...` URL instead. For the same reason, version 2's search
  can only resolve **Kick** channel names, and its **live** counter only counts Kick channels;
  live YouTube streams are not detected and show a neutral badge.
- Video and channel names are looked up best-effort from provider endpoints when a tile is
  added or its URL changes. If lookup fails (network issue, CORS, or provider restriction),
  the tile shows its placeholder. YouTube `/channel/UC...` live embeds do not resolve either
  name here; an offline Kick channel may not have a live-stream title.
- Chat (version 2) is only available while a stream is actually live, and only for
  `youtube-video` and `kick-channel` tiles — a YouTube `/channel/UC...` live embed has no
  video id to point a chat frame at. A provider or network filter can also refuse to let its
  chat page be framed, which leaves the panel blank; use **↗** to open it in a tab.
- Corporate/school networks with content filtering (e.g. Zscaler) commonly block the
  "Video Streaming" category, which prevents YouTube/Kick embeds, chat frames, and the title
  lookup above from loading. If streams, chats, or titles fail to load, try a different
  network.
- The `/v1` and `/v2` routes rely on history-based routing, so the host must serve
  `index.html` for unknown paths. Vite's dev and preview servers do this automatically, and
  `public/_redirects` does it for the Cloudflare Pages deployment. A different static host
  needs its own equivalent rewrite rule, or a hard refresh on those URLs returns 404.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`, and npm (the version range Vite 8 requires).

## Development

- `npm run lint` — runs [Oxlint](https://oxc.rs/docs/guide/usage/linter/rules).
- `npm run build` — type-checks (`tsc -b`) and builds a production bundle with Vite.
- `npm run preview` — serves the built bundle, including the `/v1` and `/v2` routes.

