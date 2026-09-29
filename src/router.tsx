// Tiny history-API router. The app only has three destinations (version picker, v1, v2), so a
// dependency-free hook is enough: `useRoute` re-renders on popstate and on programmatic
// `navigate()` calls, which dispatch a synthetic event since popstate does not fire for pushState.
import { useEffect, useState } from 'react';

export type Route = 'picker' | 'v1' | 'v2';

const NAVIGATION_EVENT = 'arp:navigate';

function routeFromPath(pathname: string): Route {
  const normalized = pathname.replace(/\/+$/, '').toLowerCase();
  if (normalized === '/v1') {
    return 'v1';
  }
  if (normalized === '/v2') {
    return 'v2';
  }
  return 'picker';
}

export function navigate(path: string) {
  // Avoids stacking duplicate history entries when a link to the current page is clicked.
  if (window.location.pathname + window.location.search === path) {
    return;
  }
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const sync = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', sync);
    window.addEventListener(NAVIGATION_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAVIGATION_EVENT, sync);
    };
  }, []);

  return route;
}
