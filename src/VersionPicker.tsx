// Landing page at "/": lets the user choose which build of the app to open.
import { navigate } from './router';
import './VersionPicker.css';

export function VersionPicker() {
  return (
    <div className="picker">
      <div className="picker__glow" aria-hidden="true" />
      <main className="picker__inner">
        <p className="picker__eyebrow">ARP Multi View</p>
        <h1 className="picker__title">Pick your build</h1>
        <p className="picker__sub">Both versions watch several YouTube and Kick streams at once. They keep separate saved layouts.</p>

        <div className="picker__cards">
          <button type="button" className="picker-card" onClick={() => navigate('/v1')}>
            <span className="picker-card__tag">Version 1</span>
            <span className="picker-card__name">Classic grid</span>
            <span className="picker-card__desc">Paste URLs, auto / 2x2 / 4x4 / spotlight layouts, three colour themes.</span>
            <span className="picker-card__go">Open /v1 &rarr;</span>
          </button>

          <button type="button" className="picker-card picker-card--featured" onClick={() => navigate('/v2')}>
            <span className="picker-card__tag">Version 2 &middot; new</span>
            <span className="picker-card__name">Collage</span>
            <span className="picker-card__desc">
              Smart search, up to 12 streams, column slider, chat side panel, quality &amp; sound controls, keyboard
              shortcuts, shareable links.
            </span>
            <span className="picker-card__go">Open /v2 &rarr;</span>
          </button>
        </div>
      </main>
    </div>
  );
}
