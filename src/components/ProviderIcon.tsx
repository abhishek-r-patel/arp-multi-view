// Small colored circular glyph identifying a tile's provider (YouTube play-triangle in red,
// or Kick's bracket mark in green), used in tile toolbars and the manage-streams list instead
// of a text badge, to save horizontal space.
import type { Provider } from '../types';

interface Props {
  provider: Provider;
}

const LABEL: Record<Provider, string> = {
  youtube: 'YouTube',
  kick: 'Kick',
};

// Compact circular glyph shown instead of a text badge, to save toolbar space.
export function ProviderIcon({ provider }: Props) {
  return (
    <span className={`provider-icon provider-icon--${provider}`} role="img" aria-label={LABEL[provider]} title={LABEL[provider]}>
      {provider === 'youtube' ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M8 6v12l10-6z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path fill="currentColor" d="M6 5h4v5.2L14.2 5H19l-5.8 7 5.8 7h-4.8L10 14.8V19H6z" />
        </svg>
      )}
    </span>
  );
}
