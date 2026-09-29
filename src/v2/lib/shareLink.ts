// Encodes/decodes the v2 collage into a compact URL query string so a layout can be shared as a
// link. Format: `?s=yt.VIDEOID~yc.CHANNELID~kc.slug&c=3`. Ids are re-validated on decode because
// the string comes from an untrusted source (someone else's link) before it reaches an iframe src.
import type { StreamSource, StreamTarget } from '../../types';

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_STREAMS = 12;

function encodeTarget(target: StreamTarget): string {
  if (target.kind === 'youtube-video') {
    return `yt.${target.videoId}`;
  }
  if (target.kind === 'youtube-channel') {
    return `yc.${target.channelId}`;
  }
  return `kc.${target.slug}`;
}

// Rebuilds a target (and the canonical URL/label that go with it) from one encoded token.
// Returns null for anything unrecognized or containing characters we would not embed.
function decodeToken(token: string): StreamSource | null {
  const separator = token.indexOf('.');
  if (separator === -1) {
    return null;
  }
  const prefix = token.slice(0, separator);
  const id = token.slice(separator + 1);
  if (!SAFE_ID.test(id)) {
    return null;
  }

  if (prefix === 'yt') {
    return {
      id: crypto.randomUUID(),
      url: `https://www.youtube.com/watch?v=${id}`,
      label: `YouTube video ${id}`,
      target: { kind: 'youtube-video', videoId: id },
      muted: true,
    };
  }
  if (prefix === 'yc') {
    return {
      id: crypto.randomUUID(),
      url: `https://www.youtube.com/channel/${id}`,
      label: `YouTube channel ${id}`,
      target: { kind: 'youtube-channel', channelId: id },
      muted: true,
    };
  }
  if (prefix === 'kc') {
    return {
      id: crypto.randomUUID(),
      url: `https://kick.com/${id}`,
      label: `Kick: ${id}`,
      target: { kind: 'kick-channel', slug: id },
      muted: true,
    };
  }
  return null;
}

// Builds the absolute /v2 link that reproduces the given collage.
export function buildShareUrl(streams: StreamSource[], columns: number): string {
  const params = new URLSearchParams();
  params.set('s', streams.slice(0, MAX_STREAMS).map((s) => encodeTarget(s.target)).join('~'));
  params.set('c', String(columns));
  return `${window.location.origin}/v2?${params.toString()}`;
}

export interface SharedCollage {
  streams: StreamSource[];
  columns: number | null;
}

// Reads a shared collage out of the current query string, or null if there is nothing to restore.
export function readSharedCollage(search: string): SharedCollage | null {
  const params = new URLSearchParams(search);
  const encoded = params.get('s');
  if (!encoded) {
    return null;
  }

  const streams = encoded
    .split('~')
    .map((token) => decodeToken(token.trim()))
    .filter((source): source is StreamSource => source !== null)
    .slice(0, MAX_STREAMS);

  if (streams.length === 0) {
    return null;
  }

  const rawColumns = Number(params.get('c'));
  const columns = Number.isInteger(rawColumns) && rawColumns >= 1 && rawColumns <= 6 ? rawColumns : null;
  return { streams, columns };
}
