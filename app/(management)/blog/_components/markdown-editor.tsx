'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

export interface EditorHandle {
  surround(before: string, after?: string): void;
  linePrefix(prefix: string): void;
  insert(text: string): void;
}

// Syntax colors resolve to CSS variables (see `.cm-md-syntax` in globals.css)
// so each theme gets an AA-readable shade instead of one fixed hex.
const mdStyle = HighlightStyle.define([
  { tag: tags.heading1, color: 'var(--cm-heading)', fontWeight: '700', fontSize: '1.12em' },
  { tag: tags.heading2, color: 'var(--cm-heading)', fontWeight: '700' },
  { tag: tags.heading3, color: 'var(--cm-heading-3)', fontWeight: '600' },
  { tag: tags.strong, fontWeight: '700', color: 'var(--cm-strong)' },
  { tag: tags.emphasis, fontStyle: 'italic', color: 'var(--cm-em)' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: 'var(--cm-link)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--cm-url)' },
  { tag: tags.monospace, color: 'var(--cm-mono)' },
  { tag: tags.meta, color: 'var(--cm-meta)' },
  { tag: tags.quote, color: 'var(--cm-quote)', fontStyle: 'italic' },
  { tag: tags.list, color: 'var(--cm-list)' },
]);

const baseTheme = EditorView.theme({
  '&': { backgroundColor: 'transparent', height: '100%' },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    overflowY: 'auto',
  },
  '.cm-content': { padding: '16px', minHeight: '100%' },
  '.cm-line': { padding: '0' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(124,58,237,0.12) !important',
  },
  '.cm-placeholder': { color: 'rgba(148,163,184,0.45)' },
});

const EXTENSIONS = [
  markdown({ base: markdownLanguage, codeLanguages: languages }),
  syntaxHighlighting(mdStyle),
  baseTheme,
  EditorView.lineWrapping,
];

const SETUP = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
  highlightActiveLine: false,
  highlightSelectionMatches: false,
  closeBrackets: false,
  autocompletion: false,
  searchKeymap: false,
  crosshairCursor: false,
};

export const MarkdownEditor = forwardRef<
  EditorHandle,
  { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }
>(({ value, onChange, placeholder, className }, ref) => {
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    surround(before, after = before) {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const sel = view.state.sliceDoc(from, to) || 'ข้อความ';
      view.dispatch({
        changes: { from, to, insert: `${before}${sel}${after}` },
        selection: { anchor: from + before.length, head: from + before.length + sel.length },
      });
      view.focus();
    },
    linePrefix(prefix) {
      const view = viewRef.current;
      if (!view) return;
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      view.dispatch({
        changes: { from: line.from, insert: prefix },
        selection: { anchor: from + prefix.length },
      });
      view.focus();
    },
    insert(text) {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
      view.focus();
    },
  }));

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onCreateEditor={(view) => { viewRef.current = view; }}
      extensions={EXTENSIONS}
      basicSetup={SETUP}
      placeholder={placeholder}
      className={className}
    />
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';
