// Best-effort lookup of a stream's real display names (video title AND channel/uploader name)
// from the provider's public oEmbed/API endpoints, used by StreamTile so the tile header can
// show either one (see App.tsx's titleMode toggle) instead of the raw video-id/slug placeholder.
import type { StreamTarget } from '../types';

const REQUEST_TIMEOUT_MS = 5000;

// Fetches a URL and parses the response as JSON. Any failure — network error, CORS block,
// timeout, or a non-OK HTTP status — resolves to null instead of throwing, since callers treat
// null as "couldn't get a title, just keep showing the fallback label".
async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok ? await response.json() : null;
  } catch {
    // Network errors, CORS blocks, or timeouts just mean we keep the fallback label.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// The two names a tile header can be toggled between (App.tsx's `titleMode`).
export interface ResolvedStreamNames {
  videoName: string | null;
  channelName: string | null;
}

const EMPTY_NAMES: ResolvedStreamNames = { videoName: null, channelName: null };

// Best-effort: resolves both the video/stream title and the channel/uploader display name for
// a stream tile. Any field that couldn't be resolved is null; StreamTile falls back to the
// original placeholder label for whichever one is missing.
// - youtube-video: YouTube's public oEmbed endpoint (no API key needed) returns both `title`
//   (the video) and `author_name` (the channel) in one request.
// - kick-channel: Kick's public channel API returns the channel's display name, and — if
//   currently live — the stream's own session title (Kick's closest equivalent of a "video").
// - youtube-channel (a channel's live_stream embed): has no single video URL to look up from
//   client-side, so both fields stay null and the "YouTube channel ..." fallback label is used.
export async function fetchStreamNames(target: StreamTarget): Promise<ResolvedStreamNames> {
  if (target.kind === 'youtube-video') {
    const watchUrl = `https://www.youtube.com/watch?v=${target.videoId}`;
    const data = await fetchJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);
    const parsed = data as { title?: unknown; author_name?: unknown } | null;
    const videoName = typeof parsed?.title === 'string' && parsed.title.trim() ? parsed.title : null;
    const channelName = typeof parsed?.author_name === 'string' && parsed.author_name.trim() ? parsed.author_name : null;
    return { videoName, channelName };
  }

  if (target.kind === 'kick-channel') {
    const data = await fetchJson(`https://kick.com/api/v2/channels/${encodeURIComponent(target.slug)}`);
    const channel = data as { user?: { username?: unknown }; livestream?: { session_title?: unknown } } | null;
    const channelName = typeof channel?.user?.username === 'string' ? channel.user.username : null;
    const videoName = typeof channel?.livestream?.session_title === 'string' ? channel.livestream.session_title : null;
    return { videoName, channelName };
  }

  return EMPTY_NAMES;
}
