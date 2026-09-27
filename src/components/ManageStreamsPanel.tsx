// The collapsible "Manage streams" panel: lists every stream as an editable/removable/draggable
// row, above the AddStreamForm used to add new ones. Row order here IS the same `streams` array
// StreamGrid renders tiles from, so dragging a row here reorders the video tiles too (and vice
// versa in grid layouts — both call the same onReorder callback from App.tsx).
import { useState, type FormEvent } from 'react';
import type { StreamSource } from '../types';
import { providerOf } from '../types';
import { AddStreamForm } from './AddStreamForm';
import { ProviderIcon } from './ProviderIcon';
import type { ParseFailure } from '../lib/parseStreamUrl';

interface Props {
  streams: StreamSource[];
  onAdd: (rawText: string) => ParseFailure[];
  onRemove: (id: string) => void;
  onUpdateUrl: (id: string, rawUrl: string) => string | null;
  onReorder: (draggedId: string, targetId: string) => void;
}

export function ManageStreamsPanel({ streams, onAdd, onRemove, onUpdateUrl, onReorder }: Props) {
  return (
    <details className="manage-streams" open>
      <summary>Manage streams ({streams.length})</summary>
      <AddStreamForm onAdd={onAdd} />
      {streams.length > 0 && (
        <ul className="manage-streams__list">
          {streams.map((source, index) => (
            <StreamRow
              key={source.id}
              index={index + 1}
              source={source}
              onRemove={onRemove}
              onUpdateUrl={onUpdateUrl}
              onReorder={onReorder}
            />
          ))}
        </ul>
      )}
    </details>
  );
}

interface RowProps {
  index: number;
  source: StreamSource;
  onRemove: (id: string) => void;
  onUpdateUrl: (id: string, rawUrl: string) => string | null;
  onReorder: (draggedId: string, targetId: string) => void;
}

// One editable row: keeps its own draft `value` for the URL input (only committed via
// onUpdateUrl when the form is submitted, so typing doesn't affect the grid until confirmed),
// plus this row's drag-and-drop-to-reorder handlers.
function StreamRow({ index, source, onRemove, onUpdateUrl, onReorder }: RowProps) {
  const [value, setValue] = useState(source.url);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const provider = providerOf(source.target);

  // Re-parses the edited URL via App's handleUpdateUrl; shows the returned error (if any)
  // below the row instead of touching the grid. A no-op submit (unchanged value) clears any
  // stale error without calling onUpdateUrl.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.trim() === source.url) {
      setError(null);
      return;
    }
    setError(onUpdateUrl(source.id, value));
  }

  // Stashes this row's stream id in the native drag payload so the drop target can identify
  // which stream was dragged (see StreamTile.tsx for the matching pattern used by video tiles).
  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', source.id);
  }

  // Must call preventDefault() for the browser to treat this row as a valid drop target.
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  // Reads the dragged stream's id back out and asks App to move it to this row's position.
  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const draggedId = event.dataTransfer.getData('text/plain');
    if (draggedId) {
      onReorder(draggedId, source.id);
    }
  }

  return (
    <li
      className={`manage-streams__row${isDragOver ? ' manage-streams__row--drag-over' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <form onSubmit={handleSubmit}>
        <span className="manage-streams__handle" aria-hidden="true">
          ⠿
        </span>
        <span className="manage-streams__index">{index}.</span>
        <ProviderIcon provider={provider} />
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="icon-btn icon-btn--update" aria-label="Update stream URL" title="Update">
          ✓
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--remove"
          aria-label="Remove stream"
          title="Remove"
          onClick={() => onRemove(source.id)}
        >
          🗑
        </button>
      </form>
      {error && <p className="manage-streams__error">{error}</p>}
    </li>
  );
}
