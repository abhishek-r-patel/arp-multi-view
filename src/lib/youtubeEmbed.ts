// Builds the `src` URL for a YouTube <iframe> embed from a parsed StreamTarget.
import type { StreamTarget } from '../types';

type YouTubeTarget = Extract<StreamTarget, { kind: 'youtube-video' } | { kind: 'youtube-channel' }>;

// `enablejsapi=1` + a matching `origin` are required for the YouTube IFrame Player API
// (see youtubeApi.ts) to be able to send/receive postMessage commands to this iframe.
// `mute=1` + `autoplay=0` request a muted, non-autoplaying embed; users can still start
// individual players using their native controls or try the toolbar's "Play all" button.
export function buildYouTubeEmbedSrc(target: YouTubeTarget): string {
  const params = new URLSearchParams({
    autoplay: '0',
    mute: '1',
    playsinline: '1',
    rel: '0',
    enablejsapi: '1',
    origin: window.location.origin,
  });

  if (target.kind === 'youtube-video') {
    return `https://www.youtube.com/embed/${target.videoId}?${params.toString()}`;
  }

  // A channel target embeds that channel's current live broadcast via the special
  // `live_stream` embed path, identified by `channel` query param instead of a video id.
  params.set('channel', target.channelId);
  return `https://www.youtube.com/embed/live_stream?${params.toString()}`;
}
