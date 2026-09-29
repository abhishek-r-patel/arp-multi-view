// Smart search box. Debounces typing, runs the key-free lookup in smartSearch.ts, and shows the
// matches as add-able rows. Enter adds the first match immediately so a name + Enter is enough.
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { StreamSource } from '../../types';
import { searchStreams, type SearchCandidate } from '../lib/smartSearch';

const DEBOUNCE_MS = 350;

interface Props {
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onAdd: (source: StreamSource) => void;
}

export function CommandBar({ inputRef, disabled, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  // Every search run gets a sequence number; only the newest one is allowed to write state, so a
  // slow earlier request cannot overwrite the results of a later query.
  const runIdRef = useRef(0);

  // Clearing on empty input is handled in onChange, not here: calling setState synchronously in
  // an effect body is what Oxlint's react/set-state-in-effect flags.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const runId = ++runIdRef.current;
    const timer = setTimeout(() => {
      searchStreams(trimmed).then((outcome) => {
        if (runId !== runIdRef.current) {
          return;
        }
        setCandidates(outcome.candidates);
        setMessage(outcome.message);
        setIsSearching(false);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  function reset() {
    setQuery('');
    setCandidates([]);
    setMessage(null);
    setIsSearching(false);
    // Invalidates any in-flight search so its result is discarded.
    runIdRef.current += 1;
  }

  function add(candidate: SearchCandidate) {
    onAdd(candidate.source);
    reset();
  }

  return (
    <div className="v2-search">
      <div className="v2-search__field">
        <span className="v2-search__icon" aria-hidden="true">
          ⌕
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          disabled={disabled}
          placeholder={disabled ? 'Collage is full — remove a stream to add another' : 'Search a Kick name, or paste a YouTube / Kick link'}
          aria-label="Search or paste a stream"
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            if (value.trim()) {
              setIsSearching(true);
            } else {
              reset();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && candidates.length > 0) {
              event.preventDefault();
              add(candidates[0]);
            }
            if (event.key === 'Escape') {
              reset();
              event.currentTarget.blur();
            }
          }}
        />
        {isSearching && <span className="v2-search__spinner" aria-label="Searching" />}
      </div>

      {(candidates.length > 0 || message) && (
        <div className="v2-results" role="listbox" aria-label="Search results">
          {candidates.map((candidate) => (
            <button key={candidate.key} type="button" className="v2-result" role="option" aria-selected="false" onClick={() => add(candidate)}>
              <span className="v2-result__main">
                <strong>{candidate.displayName}</strong>
                <em>{candidate.subtitle}</em>
              </span>
              {candidate.live && <span className="v2-badge v2-badge--live">LIVE</span>}
              <span className="v2-result__add">Add</span>
            </button>
          ))}
          {message && <p className="v2-results__message">{message}</p>}
        </div>
      )}
    </div>
  );
}
