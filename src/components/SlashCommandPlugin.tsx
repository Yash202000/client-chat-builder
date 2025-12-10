/**
 * Slash Command Plugin for Lexical Editor
 *
 * Detects slash commands (e.g., /greeting) in the Lexical editor,
 * searches for matching templates, and displays an autocomplete dropdown.
 *
 * Features:
 * - Detects '/' followed by text (no spaces)
 * - Debounced search with 150ms delay
 * - Keyboard navigation (arrows, enter, escape)
 * - Inserts template content at slash position
 * - Tracks template usage
 */

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  TextNode,
} from 'lexical';
import { searchTemplates, trackTemplateUsage, TemplateSearchResult } from '@/services/messageTemplateService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface SlashCommandPluginProps {
  onTemplateInsert?: (templateId: number, content: string) => void;
}

export function SlashCommandPlugin({ onTemplateInsert }: SlashCommandPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Search templates when query changes (debounced)
  useEffect(() => {
    if (!query) {
      setTemplates([]);
      return;
    }

    const searchDebounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchTemplates(query, 10);
        setTemplates(results);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Failed to search templates:', error);
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  // Insert template at slash command position
  const insertTemplate = useCallback((template: TemplateSearchResult) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // Get the text node containing the slash command
      const anchorNode = selection.anchor.getNode();

      if (anchorNode instanceof TextNode) {
        const textContent = anchorNode.getTextContent();
        const cursorOffset = selection.anchor.offset;

        // Find the last slash before cursor
        const textBeforeCursor = textContent.substring(0, cursorOffset);
        const slashIndex = textBeforeCursor.lastIndexOf('/');

        if (slashIndex !== -1) {
          // Remove the slash command text (from slash to cursor)
          const beforeSlash = textContent.substring(0, slashIndex);
          const afterCursor = textContent.substring(cursorOffset);

          // Replace with template content
          anchorNode.setTextContent(beforeSlash + template.content + afterCursor);

          // Move cursor to end of inserted content
          const newOffset = beforeSlash.length + template.content.length;
          selection.anchor.set(anchorNode.getKey(), newOffset, 'text');
          selection.focus.set(anchorNode.getKey(), newOffset, 'text');
        }
      }
    });

    // Track usage
    trackTemplateUsage(template.id).catch(console.error);

    // Notify parent
    if (onTemplateInsert) {
      onTemplateInsert(template.id, template.content);
    }

    // Close dropdown
    setShowDropdown(false);
    setQuery('');
    setTemplates([]);
  }, [editor, onTemplateInsert]);

  // Listen for text changes to detect slash commands
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setShowDropdown(false);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        if (!(anchorNode instanceof TextNode)) {
          setShowDropdown(false);
          return;
        }

        const textContent = anchorNode.getTextContent();
        const cursorOffset = selection.anchor.offset;
        const textBeforeCursor = textContent.substring(0, cursorOffset);

        // Find last slash
        const slashIndex = textBeforeCursor.lastIndexOf('/');

        if (slashIndex !== -1) {
          const textAfterSlash = textBeforeCursor.substring(slashIndex + 1);

          // Check if there's no space after slash (still typing command)
          if (!textAfterSlash.includes(' ')) {
            setQuery(textAfterSlash);
            setShowDropdown(true);
            return;
          }
        }

        setShowDropdown(false);
        setQuery('');
      });
    });
  }, [editor]);

  // Keyboard navigation commands
  useEffect(() => {
    if (!showDropdown || templates.length === 0) return;

    const removeArrowDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      () => {
        setSelectedIndex((prev) => (prev + 1) % templates.length);
        return true; // Prevent default
      },
      COMMAND_PRIORITY_LOW
    );

    const removeArrowUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      () => {
        setSelectedIndex((prev) => (prev - 1 + templates.length) % templates.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        if (templates[selectedIndex]) {
          insertTemplate(templates[selectedIndex]);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setShowDropdown(false);
        setQuery('');
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeArrowDown();
      removeArrowUp();
      removeEnter();
      removeEscape();
    };
  }, [editor, showDropdown, templates, selectedIndex, insertTemplate]);

  if (!showDropdown) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl" style={{ zIndex: 9999 }}>
      {isLoading ? (
        <div className="p-4 text-center text-sm text-slate-500">
          Searching templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-500">
          {query ? 'No templates found' : 'Start typing to search templates'}
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="p-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Message Templates
            </div>
            {templates.map((template, index) => (
              <button
                key={template.id}
                onClick={() => insertTemplate(template)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md transition-colors',
                  index === selectedIndex
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        /{template.shortcut}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {template.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {template.preview}
                    </p>
                    {template.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {template.scope === 'shared' && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Shared
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
