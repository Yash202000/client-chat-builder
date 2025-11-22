import React from 'react';
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

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  textareaRef,
  value,
  onChange,
  className,
}) => {
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText =
      value.substring(0, start) +
      before +
      textToInsert +
      after +
      value.substring(end);

    onChange(newText);

    // Set focus back to textarea and update cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      value.substring(0, start) +
      text +
      value.substring(end);

    onChange(newText);

    // Set focus back to textarea and update cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      // Wrap selected text
      insertMarkdown('**', '**', '');
    } else {
      // Insert placeholder
      insertMarkdown('**', '**', 'bold text');
    }
  };

  const handleItalic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      // Wrap selected text
      insertMarkdown('*', '*', '');
    } else {
      // Insert placeholder
      insertMarkdown('*', '*', 'italic text');
    }
  };

  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      insertMarkdown('[', '](https://example.com)', '');
    } else {
      insertMarkdown('[', '](https://example.com)', 'link text');
    }
  };

  const handleUnorderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;

    // Insert at beginning of line
    const newText =
      value.substring(0, lineStart) +
      '- ' +
      value.substring(lineStart);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleOrderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;

    // Insert at beginning of line
    const newText =
      value.substring(0, lineStart) +
      '1. ' +
      value.substring(lineStart);

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 3;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji);
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1 p-2 border-b", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBold}
              className="h-8 w-8 p-0"
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
              className="h-8 w-8 p-0"
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
};

export default FormattingToolbar;
