import { useEffect, useCallback, useState, useRef } from 'react';
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
import { $setBlocksType } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  onEnterKey?: () => void;
}

// Plugin to handle clearing editor when external value is set to empty
function ClearEditorPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Only clear if value changed from non-empty to empty (after sending)
    if (prevValueRef.current !== '' && value === '') {
      editor.update(() => {
        const root = $getRoot();
        const currentContent = root.getTextContent();
        // Only clear if there's actually content to clear
        if (currentContent.trim() !== '') {
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }
      });
    }
    prevValueRef.current = value;
  }, [value, editor]);

  return null;
}

// Plugin to handle Enter key using Lexical's command system
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
          return true; // Prevent default Lexical behavior
        }
        return false; // Allow Shift+Enter for new line
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onEnter]);

  return null;
}

// Toolbar component (must be inside LexicalComposer)
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  const handleBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const handleItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const handleUnorderedList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const handleOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const handleEmojiSelect = (emoji: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const textNode = $createTextNode(emoji);
        $insertNodes([textNode]);
      }
    });
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-b">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBold}
              className={cn('h-8 w-8 p-0', isBold && 'bg-gray-100 dark:bg-gray-800')}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bold (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleItalic}
              className={cn('h-8 w-8 p-0', isItalic && 'bg-gray-100 dark:bg-gray-800')}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italic (Ctrl+I)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLink}
              className="h-8 w-8 p-0"
              type="button"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert Link</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnorderedList}
              className="h-8 w-8 p-0"
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bullet List</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOrderedList}
              className="h-8 w-8 p-0"
              type="button"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Numbered List</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Emoji</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type your message...',
  className,
  onEnterKey,
}) => {
  const initialConfig = {
    namespace: 'RichTextEditor',
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
        code: 'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono',
      },
      link: 'text-blue-600 hover:underline cursor-pointer',
      list: {
        listitem: 'ml-8',
        nested: {
          listitem: 'list-none',
        },
        ol: 'list-decimal ml-4',
        ul: 'list-disc ml-4',
      },
      paragraph: 'mb-1 text-sm',
    },
    onError: (error: Error) => {
      console.error(error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
  };

  const lastEmittedValueRef = useRef(value);

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      // Only call onChange if the markdown actually changed from what we last emitted
      if (markdown !== lastEmittedValueRef.current) {
        lastEmittedValueRef.current = markdown;
        onChange(markdown);
      }
    });
  }, [onChange]);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn('relative', className)}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[80px] max-h-[200px] overflow-y-auto px-3 py-2 focus:outline-none text-sm"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="absolute top-2 left-3 text-sm text-gray-400 pointer-events-none">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={() => <div>Error loading editor</div>}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <ClearEditorPlugin value={value} />
        <EnterKeyPlugin onEnter={onEnterKey} />
      </div>
    </LexicalComposer>
  );
};

export default RichTextEditor;
