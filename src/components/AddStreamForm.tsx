// Textarea + add button for pasting one or more new stream URLs at once (one per line, or
// comma-separated). Shows a per-line error message below the form for any that failed to parse.
import { useState } from 'react';
import type { ParseFailure } from '../lib/parseStreamUrl';

interface Props {
  onAdd: (rawText: string) => ParseFailure[];
}

export function AddStreamForm({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<ParseFailure[]>([]);

  // Delegates parsing to App's handleAdd (via onAdd) and only clears the textarea if every
  // line parsed successfully; any failures stay listed below so the user can fix and resubmit.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }
    const failures = onAdd(text);
    setErrors(failures);
    if (failures.length === 0) {
      setText('');
    }
  }

  return (
    <form className="add-stream-form" onSubmit={handleSubmit}>
      <div className="add-stream-form__row">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            'Paste one or more YouTube / Kick URLs (one per line, or comma-separated)\n' +
            'e.g. https://www.youtube.com/watch?v=... , https://kick.com/somechannel'
          }
          rows={2}
        />
        <button type="submit" className="icon-btn icon-btn--add" aria-label="Add to grid" title="Add to grid">
          ➕
        </button>
      </div>
      {errors.length > 0 && (
        <ul className="add-stream-form__errors">
          {errors.map((failure, index) => (
            <li key={index}>
              <strong>{failure.input}</strong>: {failure.error}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
