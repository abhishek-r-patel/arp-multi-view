// Best-effort live-status lookup for a stream tile's badge and the header's "N live" counter.
// Kick publishes an open channel endpoint that says whether a broadcast is running right now.
// YouTube has no equivalent that works without an API key from the browser, so YouTube tiles
// report 'unknown' and the UI shows a neutral badge instead of guessing.
import type { StreamTarget } from '../../types';

export type LiveState = 'live' | 'offline' | 'unknown';

const REQUEST_TIMEOUT_MS = 5000;

export async function fetchLiveState(target: StreamTarget): Promise<LiveState> {
  if (target.kind !== 'kick-channel') {
    return 'unknown';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(target.slug)}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return 'unknown';
    }
    const data = (await response.json()) as { livestream?: unknown } | null;
    return data?.livestream ? 'live' : 'offline';
  } catch {
    // Network error, CORS block, or timeout: no claim either way.
    return 'unknown';
  } finally {
    clearTimeout(timeout);
  }
}
