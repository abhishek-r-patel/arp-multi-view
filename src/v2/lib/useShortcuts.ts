// Global keyboard shortcuts for v2. Keystrokes are ignored while the user is typing in a field
// (or in a contenteditable) so the command bar keeps working normally. Handlers are kept in a ref
// so the listener is installed once and never has to be torn down on every state change.
import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  toggleSound: () => void;
  toggleFocus: () => void;
  toggleChat: () => void;
  sync: () => void;
  setColumns: (columns: number) => void;
  toggleShortcuts: () => void;
  escape: () => void;
  focusSearch: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function useShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const current = handlersRef.current;

      if (event.key === 'Escape') {
        current.escape();
        return;
      }
      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key >= '1' && key <= '6') {
        event.preventDefault();
        current.setColumns(Number(key));
        return;
      }

      switch (key) {
        case 'm':
          event.preventDefault();
          current.toggleSound();
          break;
        case 'f':
          event.preventDefault();
          current.toggleFocus();
          break;
        case 'c':
          event.preventDefault();
          current.toggleChat();
          break;
        case 's':
          event.preventDefault();
          current.sync();
          break;
        case '/':
          event.preventDefault();
          current.focusSearch();
          break;
        case '?':
          event.preventDefault();
          current.toggleShortcuts();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
