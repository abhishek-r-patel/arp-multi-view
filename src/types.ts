// Shared domain types for the app: what a single embedded stream is, how it's embedded,
// and the app-wide layout/theme options. Every component imports from here rather than
// redefining these shapes, so parseStreamUrl.ts, StreamTile.tsx, and the players all agree.

// Discriminated union describing HOW a stream is embedded. The `kind` tag is what StreamTile
// uses to decide which player component to render (YouTubePlayer vs KickPlayer), and each
// player uses its own variant's fields to build its embed URL.
export type StreamTarget =
  | { kind: 'youtube-video'; videoId: string }
  | { kind: 'youtube-channel'; channelId: string } // a channel's current live broadcast
  | { kind: 'kick-channel'; slug: string };

// Simplified provider grouping (both YouTube kinds collapse to 'youtube') used for UI
// badges/icons and for the mute-all/unmute-all controls, which only apply to YouTube.
export type Provider = 'youtube' | 'kick';

// One stream tile's persisted state: pasted URL, fallback label (used until/if the preferred
// video or channel name resolves), embed target, and per-tile mute flag.
export interface StreamSource {
  id: string;
  url: string;
  label: string;
  target: StreamTarget;
  muted: boolean;
}

// The four grid arrangements offered in the layout switcher toolbar.
export type LayoutMode = 'auto' | 'grid2x2' | 'grid4x4' | 'spotlight';

// The three selectable color themes (see the [data-theme] CSS variable overrides in index.css).
export type ThemeName = 'midnight' | 'ember' | 'aurora';

// Which resolved name a tile header prefers to show (see lib/streamTitle.ts and the toolbar's
// "Video title"/"Channel name" toggle in App.tsx). Falls back to the tile's placeholder label
// if the preferred name hasn't resolved (or couldn't be resolved) yet.
export type TitleMode = 'video' | 'channel';

// Maps a StreamTarget's specific `kind` down to its provider, for UI grouping/filtering.
export function providerOf(target: StreamTarget): Provider {
  return target.kind.startsWith('youtube') ? 'youtube' : 'kick';
}
