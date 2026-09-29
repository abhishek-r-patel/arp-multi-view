// Chat embed URLs for the v2 side panel. YouTube's live_chat frame requires `embed_domain` to
// match the page host. Kick serves its chat popout in a frame, but both providers can refuse
// framing depending on the stream, which is why ChatPanel always offers an "open in a tab" link.
import type { StreamTarget } from '../../types';

export interface ChatEmbed {
  src: string | null;
  externalUrl: string | null;
}

export function buildChatEmbed(target: StreamTarget): ChatEmbed {
  if (target.kind === 'youtube-video') {
    return {
      src: `https://www.youtube.com/live_chat?v=${target.videoId}&embed_domain=${window.location.hostname}&dark_theme=1`,
      externalUrl: `https://www.youtube.com/watch?v=${target.videoId}`,
    };
  }
  if (target.kind === 'kick-channel') {
    return {
      src: `https://kick.com/popout/${target.slug}/chat`,
      externalUrl: `https://kick.com/${target.slug}/chatroom`,
    };
  }
  // A channel live_stream embed has no known video id up front, so there is no chat frame to point at.
  return { src: null, externalUrl: `https://www.youtube.com/channel/${target.channelId}/live` };
}
