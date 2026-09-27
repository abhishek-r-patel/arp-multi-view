// Loads the YouTube IFrame Player API script (https://www.youtube.com/iframe_api) at most once
// per page, and returns a Promise that resolves with the `window.YT` global once it's ready.
// Every YouTubePlayer instance calls this, so this module memoizes a single shared Promise
// (`apiPromise`) rather than injecting the <script> tag or registering the ready-callback more
// than once.
let apiPromise: Promise<typeof YT> | null = null;

export function loadYouTubeApi(): Promise<typeof YT> {
  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    // The YouTube script calls this global callback (by convention, not a normal <script> load
    // event) once it has finished initializing `window.YT`. Chain onto any callback that was
    // already registered, in case something else on the page also uses this same API.
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT as typeof YT);
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });

  return apiPromise;
}
