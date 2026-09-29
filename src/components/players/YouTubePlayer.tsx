// Embeds a single YouTube video, or a channel's current live broadcast, via an <iframe>, and
// wires it up to the YouTube IFrame Player API so App-level controls (the per-tile mute toggle
// and the toolbar's "Play all" button) can drive it programmatically.
import { useEffect, useRef, useState } from 'react';
import type { StreamTarget } from '../../types';
import { loadYouTubeApi } from '../../lib/youtubeApi';
import { buildYouTubeEmbedSrc } from '../../lib/youtubeEmbed';

type YouTubeTarget = Extract<StreamTarget, { kind: 'youtube-video' } | { kind: 'youtube-channel' }>;

interface Props {
  target: YouTubeTarget;
  muted: boolean;
  playSignal?: number;
  // Optional suggested playback quality ('hd1080', 'hd720', ...). Omit or pass 'default' to let
  // YouTube choose. Only ever a hint: YouTube ignores it if the stream has no such rendition.
  quality?: string;
}

export function YouTubePlayer({ target, muted, playSignal, quality }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  // Mirrors `muted` into a ref so the one-time `onReady` callback below always reads the
  // latest desired mute state, instead of the stale value captured when the player was created.
  const mutedRef = useRef(muted);
  const [error, setError] = useState<string | null>(null);
  const src = buildYouTubeEmbedSrc(target);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Creates (and on cleanup, destroys) the YT.Player instance whenever the embed `src` changes
  // (i.e. this tile's video/channel target changed). `cancelled` guards against the API loading
  // after this effect has already been cleaned up (e.g. the tile unmounted mid-load).
  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then((YTApi) => {
      if (cancelled || !iframeRef.current) {
        return;
      }
      playerRef.current = new YTApi.Player(iframeRef.current, {
        events: {
          onReady: (event) => {
            const player = event.target;
            // Defensive guard: on some networks the wrapper object exists before the iframe has
            // actually finished its handshake with YouTube, so its methods aren't callable yet.
            if (typeof player.mute !== 'function' || typeof player.unMute !== 'function') {
              return;
            }
            if (mutedRef.current) {
              player.mute();
            } else {
              player.unMute();
            }
          },
          onError: () => setError('This video is unavailable or cannot be embedded.'),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [src]);

  // Applies the per-tile mute toggle (from StreamTile's Mute/Unmute button) to the live player.
  useEffect(() => {
    const player = playerRef.current;
    // The player instance exists before the iframe finishes initializing, so its
    // methods may not be callable yet; skip until they are.
    if (!player || typeof player.mute !== 'function' || typeof player.unMute !== 'function') {
      return;
    }
    if (muted) {
      player.mute();
    } else {
      player.unMute();
    }
  }, [muted]);

  // Responds to App's "Play all" button: each increment (except the initial 0) attempts
  // playVideo() if the player is ready. A player still loading may miss that click.
  useEffect(() => {
    if (playSignal === undefined || playSignal === 0) {
      return;
    }
    const player = playerRef.current;
    if (player && typeof player.playVideo === 'function') {
      player.playVideo();
    }
  }, [playSignal]);

  // Applies the v2 quality selector. Skipped entirely when no quality prop is passed (v1).
  useEffect(() => {
    if (!quality) {
      return;
    }
    const player = playerRef.current;
    if (player && typeof player.setPlaybackQuality === 'function') {
      player.setPlaybackQuality(quality);
    }
  }, [quality, playSignal]);

  if (error) {
    return <div className="player-error">{error}</div>;
  }

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="YouTube stream"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
