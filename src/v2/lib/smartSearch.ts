// "Smart search" behind the v2 command bar: turns whatever the user typed — a full URL, a bare
// Kick channel name, a YouTube channel id or a raw video id — into addable candidates.
//
// Deliberately API-key free. Kick's open channel endpoint lets us resolve and verify a name
// (and report whether it is live), and YouTube's oEmbed endpoint lets us verify a video id and
// read its real title. YouTube *name* search is not possible from the browser without a Data API
// key, so a typed name is only looked up on Kick; the UI tells the user to paste a YouTube link.
import type { StreamSource } from '../../types';
import { parseStreamUrl } from '../../lib/parseStreamUrl';

const YT_CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const YT_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const REQUEST_TIMEOUT_MS = 5000;

export interface SearchCandidate {
  key: string;
  source: StreamSource;
  displayName: string;
  subtitle: string;
  live: boolean;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Kick slugs are lowercase and hyphenated; try the most likely spellings of a typed name.
function slugVariants(query: string): string[] {
  const base = query.trim().toLowerCase();
  const variants = new Set<string>([
    base.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''),
    base.replace(/[^a-z0-9_]+/g, ''),
    base.replace(/[^a-z0-9_]+/g, '_'),
  ]);
  return [...variants].filter(Boolean).slice(0, 3);
}

async function lookupKick(slug: string): Promise<SearchCandidate | null> {
  const data = (await fetchJson(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`)) as {
    slug?: unknown;
    user?: { username?: unknown };
    livestream?: { session_title?: unknown } | null;
  } | null;

  const resolvedSlug = typeof data?.slug === 'string' ? data.slug : null;
  if (!resolvedSlug) {
    return null;
  }

  const username = typeof data?.user?.username === 'string' ? data.user.username : resolvedSlug;
  const sessionTitle = typeof data?.livestream?.session_title === 'string' ? data.livestream.session_title : null;

  return {
    key: `kc.${resolvedSlug}`,
    displayName: username,
    subtitle: sessionTitle ?? `kick.com/${resolvedSlug}`,
    live: Boolean(data?.livestream),
    source: {
      id: crypto.randomUUID(),
      url: `https://kick.com/${resolvedSlug}`,
      label: `Kick: ${username}`,
      target: { kind: 'kick-channel', slug: resolvedSlug },
      muted: true,
    },
  };
}

async function lookupYouTubeVideo(videoId: string): Promise<SearchCandidate | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const data = (await fetchJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`)) as {
    title?: unknown;
    author_name?: unknown;
  } | null;

  if (!data) {
    return null;
  }

  const title = typeof data.title === 'string' ? data.title : `YouTube video ${videoId}`;
  const author = typeof data.author_name === 'string' ? data.author_name : 'YouTube';

  return {
    key: `yt.${videoId}`,
    displayName: author,
    subtitle: title,
    live: false,
    source: {
      id: crypto.randomUUID(),
      url: watchUrl,
      label: title,
      target: { kind: 'youtube-video', videoId },
      muted: true,
    },
  };
}

export interface SearchOutcome {
  candidates: SearchCandidate[];
  message: string | null;
}

export async function searchStreams(rawQuery: string): Promise<SearchOutcome> {
  const query = rawQuery.trim();
  if (!query) {
    return { candidates: [], message: null };
  }

  // A pasted link is unambiguous, so it wins outright.
  if (/^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be|kick\.com|player\.kick\.com)\//i.test(query)) {
    const parsed = parseStreamUrl(query);
    if (!parsed.ok) {
      return { candidates: [], message: parsed.error };
    }
    return {
      candidates: [
        {
          key: parsed.source.url,
          source: parsed.source,
          displayName: parsed.source.label,
          subtitle: parsed.source.url,
          live: false,
        },
      ],
      message: null,
    };
  }

  const lookups: Promise<SearchCandidate | null>[] = slugVariants(query).map(lookupKick);

  if (YT_CHANNEL_ID.test(query)) {
    lookups.push(
      Promise.resolve({
        key: `yc.${query}`,
        displayName: `YouTube channel ${query}`,
        subtitle: 'Embeds whatever this channel is streaming live',
        live: false,
        source: {
          id: crypto.randomUUID(),
          url: `https://www.youtube.com/channel/${query}`,
          label: `YouTube channel ${query}`,
          target: { kind: 'youtube-channel', channelId: query },
          muted: true,
        },
      }),
    );
  } else if (YT_VIDEO_ID.test(query)) {
    lookups.push(lookupYouTubeVideo(query));
  }

  const settled = await Promise.all(lookups);
  const seen = new Set<string>();
  const candidates = settled.filter((c): c is SearchCandidate => c !== null).filter((c) => {
    if (seen.has(c.key)) {
      return false;
    }
    seen.add(c.key);
    return true;
  });

  if (candidates.length === 0) {
    return {
      candidates: [],
      message: `No Kick channel matched "${query}". For YouTube, paste the live video or /channel/UC… link.`,
    };
  }

  return { candidates, message: null };
}
