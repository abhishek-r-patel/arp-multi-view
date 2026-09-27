// Parses pasted YouTube/Kick URLs into a StreamSource (or a descriptive failure message).
// Used by App.tsx's handleAdd (via parseStreamUrls, for the "paste one or more URLs" box)
// and handleUpdateUrl (via parseStreamUrl, for editing a single row's URL in place).
import type { StreamSource, StreamTarget } from '../types';

// Whitelist charset for any id we embed into a constructed URL (defense in depth,
// since we only ever build iframe src strings from values that pass this check).
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

// A URL that parsed successfully into an embeddable StreamSource.
export interface ParseSuccess {
  ok: true;
  source: StreamSource;
}

// A URL that could not be turned into a StreamSource, with a user-facing explanation
// (shown next to the offending input in AddStreamForm's error list).
export interface ParseFailure {
  ok: false;
  input: string;
  error: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

// Shorthand for building a ParseFailure with the original (untouched) input attached.
function fail(input: string, error: string): ParseFailure {
  return { ok: false, input, error };
}

// Builds a ParseSuccess: assigns a fresh random id and starts the stream muted (browsers block
// autoplay-with-sound anyway, so there's no UX cost, and it avoids surprise audio on add).
function makeSource(url: string, target: StreamTarget, label: string): ParseSuccess {
  return {
    ok: true,
    source: {
      id: crypto.randomUUID(),
      url,
      label,
      target,
      muted: true,
    },
  };
}

// Extracts a video or channel id from a YouTube-family URL. Handles youtu.be short links,
// watch?v=, /embed/<id>, /embed/live_stream?channel=<id>, /live|shorts|v/<id>, and
// /channel/<id> shapes. Explicitly rejects /@handle URLs: resolving a handle to a channel id
// requires the YouTube Data API (needs an API key), which this client-only app doesn't use.
function parseYouTube(url: URL, raw: string): ParseResult {
  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    const videoId = segments[0];
    if (videoId && SAFE_ID.test(videoId)) {
      return makeSource(raw, { kind: 'youtube-video', videoId }, `YouTube video ${videoId}`);
    }
    return fail(raw, 'Could not read a video ID from that youtu.be link.');
  }

  if (host !== 'youtube.com' && host !== 'music.youtube.com') {
    return fail(raw, 'Not a recognized YouTube URL.');
  }

  const vParam = url.searchParams.get('v');
  if (vParam && SAFE_ID.test(vParam)) {
    return makeSource(raw, { kind: 'youtube-video', videoId: vParam }, `YouTube video ${vParam}`);
  }

  if (segments[0] === 'embed' && segments[1] && segments[1] !== 'live_stream') {
    const videoId = segments[1];
    if (SAFE_ID.test(videoId)) {
      return makeSource(raw, { kind: 'youtube-video', videoId }, `YouTube video ${videoId}`);
    }
  }

  if (segments[0] === 'embed' && segments[1] === 'live_stream') {
    const channelId = url.searchParams.get('channel');
    if (channelId && SAFE_ID.test(channelId)) {
      return makeSource(raw, { kind: 'youtube-channel', channelId }, `YouTube channel ${channelId}`);
    }
  }

  if ((segments[0] === 'live' || segments[0] === 'shorts' || segments[0] === 'v') && segments[1]) {
    const videoId = segments[1];
    if (SAFE_ID.test(videoId)) {
      return makeSource(raw, { kind: 'youtube-video', videoId }, `YouTube video ${videoId}`);
    }
  }

  if (segments[0] === 'channel' && segments[1]) {
    const channelId = segments[1];
    if (SAFE_ID.test(channelId)) {
      return makeSource(raw, { kind: 'youtube-channel', channelId }, `YouTube channel ${channelId}`);
    }
  }

  if (segments[0]?.startsWith('@')) {
    return fail(
      raw,
      'Channel handle (@name) links are not supported. Paste the live video URL, or a /channel/UC... URL instead.',
    );
  }

  return fail(raw, 'Recognized a YouTube link, but could not find a video or channel ID in it.');
}

// Extracts a Kick channel slug from a kick.com or player.kick.com URL. Rejects known
// non-channel path segments (category/browse/search/etc.) and VOD links (/videos/...),
// since only a channel's live broadcast can be embedded via player.kick.com.
function parseKick(url: URL, raw: string): ParseResult {
  const host = url.hostname.replace(/^www\./, '');
  const segments = url.pathname.split('/').filter(Boolean);

  const reserved = new Set(['category', 'browse', 'search', 'subscriptions', 'following', 'settings']);
  const slug = host === 'player.kick.com' ? segments[0] : segments[0];

  if (!slug || reserved.has(slug.toLowerCase())) {
    return fail(raw, 'Could not find a channel name in that Kick URL.');
  }
  if (!SAFE_ID.test(slug)) {
    return fail(raw, 'That Kick channel name contains unsupported characters.');
  }
  if (host !== 'player.kick.com' && segments[1] === 'videos') {
    return fail(raw, 'Kick VOD links cannot be embedded, only a live channel. Paste the channel URL instead.');
  }

  return makeSource(raw, { kind: 'kick-channel', slug }, `Kick: ${slug}`);
}

// Parses a single URL string: trims it, defaults a missing scheme to https://, rejects
// non-http(s) schemes, then dispatches to the YouTube or Kick parser based on hostname.
export function parseStreamUrl(rawInput: string): ParseResult {
  const raw = rawInput.trim();
  if (!raw) {
    return fail(raw, 'Empty URL.');
  }

  let url: URL;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    return fail(raw, 'That is not a valid URL.');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return fail(raw, 'Only http(s) URLs are supported.');
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtube.com' || host === 'youtu.be' || host === 'music.youtube.com') {
    return parseYouTube(url, raw);
  }
  if (host === 'kick.com' || host === 'player.kick.com') {
    return parseKick(url, raw);
  }

  return fail(raw, 'Only youtube.com, youtu.be, and kick.com URLs are supported.');
}

// Splits a block of pasted text on newlines/commas and parses each line independently,
// so a user can paste several stream URLs at once and add them all in one submit.
export function parseStreamUrls(input: string): ParseResult[] {
  return input
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseStreamUrl);
}
