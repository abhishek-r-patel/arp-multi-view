// Minimal hand-written type declarations for the subset of the YouTube IFrame Player API
// (https://developers.google.com/youtube/iframe_api_reference) that this app actually calls.
// The real API surface is much larger; only what youtubeApi.ts / YouTubePlayer.tsx use is typed
// here. Declared as a global `YT` namespace + `Window` augmentation because the real script
// (loaded dynamically in youtubeApi.ts) attaches itself as a global, not as an ES module.
export {};

declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }

  namespace YT {
    interface PlayerEvent {
      target: Player;
    }
    interface OnStateChangeEvent extends PlayerEvent {
      data: number;
    }
    interface PlayerOptions {
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: PlayerEvent) => void;
        onStateChange?: (event: OnStateChangeEvent) => void;
        onError?: (event: PlayerEvent & { data: number }) => void;
      };
    }

    class Player {
      constructor(element: string | HTMLElement, options?: PlayerOptions);
      playVideo(): void;
      pauseVideo(): void;
      mute(): void;
      unMute(): void;
      isMuted(): boolean;
      setVolume(volume: number): void;
      setPlaybackQuality(suggestedQuality: string): void;
      destroy(): void;
    }
  }
}
