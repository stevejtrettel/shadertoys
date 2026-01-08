/**
 * CodeMirror Editor Module
 *
 * Dynamically imported only when editor mode is enabled.
 * Provides GLSL editing with syntax highlighting.
 */

import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';

import './codemirror.css';

export interface EditorInstance {
  view: EditorView;
  getSource: () => string;
  setSource: (source: string) => void;
  destroy: () => void;
}

/**
 * Dark theme for CodeMirror matching the shadertoy aesthetic.
 */
const darkTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    backgroundColor: '#1a1a2e',
  },
  '.cm-content': {
    fontFamily: '"Fira Code", "Source Code Pro", "Consolas", monospace',
    caretColor: '#fff',
  },
  '.cm-cursor': {
    borderLeftColor: '#fff',
  },
  '.cm-gutters': {
    backgroundColor: '#16162a',
    color: '#666',
    border: 'none',
    borderRight: '1px solid #333',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1f1f3a',
  },
  '.cm-activeLine': {
    backgroundColor: '#1f1f3a',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#3a3a5c !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#3a3a5c !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#3a3a5c',
    outline: '1px solid #666',
  },
}, { dark: true });

/**
 * Create a CodeMirror editor instance.
 *
 * @param container - DOM element to mount the editor in
 * @param initialSource - Initial GLSL source code
 * @param onChange - Optional callback when content changes
 * @returns Editor instance with control methods
 */
export function createEditor(
  container: HTMLElement,
  initialSource: string,
  onChange?: (source: string) => void
): EditorInstance {
  const updateListener = onChange ? EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChange(update.state.doc.toString());
    }
  }) : [];

  const state = EditorState.create({
    doc: initialSource,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      bracketMatching(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      cpp(),  // C/C++ syntax works well for GLSL
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      darkTheme,
      updateListener,
      EditorView.lineWrapping,
    ],
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  return {
    view,
    getSource: () => view.state.doc.toString(),
    setSource: (source: string) => {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: source,
        },
      });
    },
    destroy: () => view.destroy(),
  };
}
