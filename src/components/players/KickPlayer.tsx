// Embeds a Kick channel's live stream via Kick's own official iframe player
// (https://player.kick.com/<channel>). Unlike YouTube, Kick has no documented API for a parent
// page to control mute/play, so this tile relies entirely on the player's own on-screen controls
// (StreamTile renders a hint below Kick tiles telling the user to use them).
import type { StreamTarget } from '../../types';

interface Props {
  target: Extract<StreamTarget, { kind: 'kick-channel' }>;
}

// Kick does not expose a documented parent-page control API, so this tile relies
// on the player's own on-screen controls for play/pause/volume.
export function KickPlayer({ target }: Props) {
  const src = `https://player.kick.com/${target.slug}?autoplay=false&muted=true`;

  return (
    <iframe
      src={src}
      title={`Kick stream: ${target.slug}`}
      allow="autoplay; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
