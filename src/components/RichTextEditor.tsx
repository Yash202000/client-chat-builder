import { useEffect, useCallback, useState, useRef, MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  $insertNodes,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SlashCommandPlugin } from './SlashCommandPlugin';

export interface RichTextEditorHandle {
  insertEmoji: (emoji: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  onEnterKey?: () => void;
  editorRef?: MutableRefObject<RichTextEditorHandle | null>;
}

// ─── Sync external value into editor ─────────────────────────────────────────
function SyncValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const prevValueRef = useRef(value);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ tags }) => {
      if (!tags.has('external')) {
        isInternalChangeRef.current = true;
        setTimeout(() => { isInternalChangeRef.current = false; }, 100);
      }
    });
  }, [editor]);

  useEffect(() => {
    if (prevValueRef.current === value) return;
    const prevValue = prevValueRef.current;
    prevValueRef.current = value;
    if (isInternalChangeRef.current) return;

    editor.update(() => {
      const root = $getRoot();
      const currentContent = root.getTextContent().trim();
      if (prevValue !== '' && value === '') {
        if (currentContent !== '') {
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }
      } else if (value !== '' && currentContent !== value.trim()) {
        root.clear();
        $convertFromMarkdownString(value, TRANSFORMERS);
      }
    }, { tag: 'external' });
  }, [value, editor]);

  return null;
}

// ─── Enter key handler ────────────────────────────────────────────────────────
function EnterKeyPlugin({ onEnter }: { onEnter?: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onEnter) return;
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (event && !event.shiftKey) {
          event.preventDefault();
          onEnter();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onEnter]);

  return null;
}

// ─── Emoji insert plugin (exposes insertEmoji via a mutable ref) ──────────────
function EmojiInsertPlugin({
  handleRef,
}: {
  handleRef: MutableRefObject<{ insertEmoji: (e: string) => void } | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    handleRef.current = {
      insertEmoji: (emoji: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $insertNodes([$createTextNode(emoji)]);
          } else {
            const root = $getRoot();
            const last = root.getLastChild();
            if (last) last.append($createTextNode(emoji));
          }
        });
        editor.focus();
      },
    };
    return () => { handleRef.current = null; };
  }, [editor, handleRef]);

  return null;
}

// ─── Floating format toolbar (appears on text selection) ─────────────────────
function FloatingFormatToolbar() {
  const [editor] = useLexicalComposerContext();
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        setVisible(false);
        return;
      }
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));

      const nativeSel = window.getSelection();
      if (!nativeSel || nativeSel.rangeCount === 0) { setVisible(false); return; }
      const rect = nativeSel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width) { setVisible(false); return; }

      setPos({
        top: rect.top + window.scrollY - 44,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setVisible(true);
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => { update(); return false; },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, update]);

  // Hide toolbar on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode, title: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
        active
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );

  const toolbar = (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={barRef}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.1 }}
          style={{ position: 'absolute', top: pos.top, left: pos.left, transform: 'translateX(-50%)', zIndex: 9999 }}
          className="flex items-center gap-0.5 px-1.5 py-1 bg-popover border border-border rounded-lg shadow-lg"
        >
          {btn(isBold,   () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),   <Bold className="h-3 w-3" />,         'Bold (Ctrl+B)')}
          {btn(isItalic, () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'), <Italic className="h-3 w-3" />,       'Italic (Ctrl+I)')}
          <div className="w-px h-3.5 bg-border mx-0.5" />
          {btn(false, () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined), <List className="h-3 w-3" />,        'Bullet list')}
          {btn(false, () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),   <ListOrdered className="h-3 w-3" />, 'Numbered list')}
          <div className="w-px h-3.5 bg-border mx-0.5" />
          {btn(false, () => {
            const url = prompt('Enter URL:');
            if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
          }, <LinkIcon className="h-3 w-3" />, 'Insert link')}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(toolbar, document.body);
}

// ─── Main component ───────────────────────────────────────────────────────────
function RichTextEditor({
  value, onChange, placeholder = 'Type your message…', className, onEnterKey, editorRef,
}: RichTextEditorProps) {
    const emojiHandleRef = useRef<{ insertEmoji: (e: string) => void } | null>(null);

    // Expose insertEmoji via the optional editorRef prop
    useEffect(() => {
      if (editorRef) {
        editorRef.current = {
          insertEmoji: (emoji: string) => emojiHandleRef.current?.insertEmoji(emoji),
        };
        return () => { editorRef.current = null; };
      }
    }, [editorRef]);

    const initialConfig = {
      namespace: 'RichTextEditor',
      theme: {
        text: {
          bold: 'font-bold',
          italic: 'italic',
          underline: 'underline',
          strikethrough: 'line-through',
          code: 'bg-muted px-1 py-0.5 rounded text-sm font-mono',
        },
        link: 'text-primary hover:underline cursor-pointer',
        list: {
          listitem: 'ml-8',
          nested: { listitem: 'list-none' },
          ol: 'list-decimal ml-4',
          ul: 'list-disc ml-4',
        },
        paragraph: 'mb-1 text-sm',
      },
      onError: (error: Error) => console.error(error),
      nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, LinkNode, AutoLinkNode],
    };

    const lastEmittedValueRef = useRef(value);

    const handleChange = useCallback((editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        if (markdown !== lastEmittedValueRef.current) {
          lastEmittedValueRef.current = markdown;
          onChange(markdown);
        }
      });
    }, [onChange]);

    return (
      <LexicalComposer initialConfig={initialConfig}>
        <div className={cn('relative', className)}>
          <FloatingFormatToolbar />
          <EmojiInsertPlugin handleRef={emojiHandleRef} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="min-h-[52px] max-h-[160px] overflow-y-auto py-2 focus:outline-none text-sm text-foreground"
                  aria-placeholder={placeholder}
                  placeholder={
                    <div className="absolute top-2 left-0 text-sm text-muted-foreground/50 pointer-events-none select-none">
                      {placeholder}
                    </div>
                  }
                />
              }
              ErrorBoundary={() => <div>Error loading editor</div>}
            />
            <SlashCommandPlugin onTemplateInsert={(id, content) => {
              console.log('Template inserted:', id, content);
            }} />
          </div>
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} />
          <SyncValuePlugin value={value} />
          <EnterKeyPlugin onEnter={onEnterKey} />
        </div>
      </LexicalComposer>
    );
}

export default RichTextEditor;
