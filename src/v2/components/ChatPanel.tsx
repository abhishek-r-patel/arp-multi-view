// Chat card for one stream, stacked in the right-hand rail. Provider chat frames can be refused
// by the provider or a network filter (framing rules differ per stream/region), so an "open in a
// tab" escape hatch is always shown next to the frame rather than only after a failure we cannot
// detect.
import { useEffect, useState } from 'react';
import type { StreamSource } from '../../types';
import { providerOf } from '../../types';
import { fetchStreamNames } from '../../lib/streamTitle';
import { buildChatEmbed } from '../lib/chatEmbed';

interface Props {
  source: StreamSource;
  onClose: () => void;
}

export function ChatPanel({ source, onClose }: Props) {
  const { src, externalUrl } = buildChatEmbed(source.target);
  const provider = providerOf(source.target);
  const [channelName, setChannelName] = useState<string | null>(null);

  // Served from the browser cache in practice: the tile for this same stream already asked.
  useEffect(() => {
    let cancelled = false;
    fetchStreamNames(source.target).then((names) => {
      if (!cancelled) {
        setChannelName(names.channelName);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [source.target]);

  const title = channelName ?? source.label;

  return (
    <section className="v2-chat">
      <header className="v2-chat__bar">
        <span className={`v2-badge v2-badge--${provider}`}>{provider === 'youtube' ? 'YT' : 'KICK'}</span>
        <span className="v2-chat__title">{title}</span>
        {externalUrl && (
          <a className="v2-icon" href={externalUrl} target="_blank" rel="noopener noreferrer" title="Open chat in a new tab">
            ↗
          </a>
        )}
        <button type="button" className="v2-icon" onClick={onClose} aria-label={`Close chat for ${title}`} title="Close chat (C)">
          ✕
        </button>
      </header>
      {src ? (
        <iframe
          key={src}
          className="v2-chat__frame"
          src={src}
          title={`Chat for ${title}`}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      ) : (
        <p className="v2-chat__empty">
          Chat is not available for a channel live-stream embed. Open the stream in a tab to follow its chat.
        </p>
      )}
    </section>
  );
}
