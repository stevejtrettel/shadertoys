/**
 * CodeMirror Editor Module
 *
 * Dynamically imported only when editor mode is enabled.
 * Provides GLSL editing with syntax highlighting.
 */

import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { cpp } from '@codemirror/lang-cpp';

import './codemirror.css';

export interface EditorInstance {
  view: EditorView;
  getSource: () => string;
  setSource: (source: string) => void;
  destroy: () => void;
}

/**
 * Light theme for CodeMirror matching the non-editor code viewer style.
 */
const lightTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    backgroundColor: '#ffffff',
  },
  '.cm-content': {
    fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
    caretColor: '#000',
  },
  '.cm-cursor': {
    borderLeftColor: '#000',
  },
  '.cm-gutters': {
    backgroundColor: '#ffffff',
    color: '#999',
    border: 'none',
    borderRight: '1px solid #e0e0e0',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f5f5f5',
  },
  '.cm-activeLine': {
    backgroundColor: '#f8f8f8',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#d7d4f0 !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#d7d4f0 !important',
  },
  '.cm-matchingBracket': {
    backgroundColor: '#e0e0e0',
    outline: '1px solid #999',
  },
}, { dark: false });

/**
 * Syntax highlighting colors matching the Prism theme used in non-editor mode.
 */
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: '#6a9955' },
  { tag: tags.lineComment, color: '#6a9955' },
  { tag: tags.blockComment, color: '#6a9955' },
  { tag: tags.keyword, color: '#0000ff' },
  { tag: tags.controlKeyword, color: '#0000ff' },
  { tag: tags.operatorKeyword, color: '#0000ff' },
  { tag: tags.definitionKeyword, color: '#0000ff' },
  { tag: tags.moduleKeyword, color: '#0000ff' },
  { tag: tags.string, color: '#a31515' },
  { tag: tags.number, color: '#098658' },
  { tag: tags.integer, color: '#098658' },
  { tag: tags.float, color: '#098658' },
  { tag: tags.operator, color: '#000000' },
  { tag: tags.function(tags.variableName), color: '#795e26' },
  { tag: tags.typeName, color: '#267f99' },
  { tag: tags.className, color: '#267f99' },
  { tag: tags.definition(tags.variableName), color: '#001080' },
  { tag: tags.variableName, color: '#001080' },
  { tag: tags.punctuation, color: '#000000' },
  { tag: tags.paren, color: '#000000' },
  { tag: tags.brace, color: '#000000' },
  { tag: tags.bracket, color: '#000000' },
  { tag: tags.propertyName, color: '#001080' },
  { tag: tags.macroName, color: '#0000ff' },
  { tag: tags.labelName, color: '#795e26' },
]);

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
      syntaxHighlighting(lightHighlightStyle, { fallback: true }),
      cpp(),  // C/C++ syntax works well for GLSL
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      lightTheme,
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
