// Generic hook that behaves like useState but persists the value to localStorage under `key`,
// so it survives page reloads. Used for every piece of app state that should be remembered
// (stream list, layout mode, spotlight selection, theme, title mode) — see App.tsx.
import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initializer: reads localStorage only once, on first mount, instead of on every render.
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      // Corrupt/foreign JSON under this key, or localStorage unavailable: fall back to the default.
      return initialValue;
    }
  });

  // Re-persists to localStorage whenever the value (or key) changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Persistence is best-effort (private browsing / quota can block it).
    }
  }, [key, value]);

  return [value, setValue] as const;
}
