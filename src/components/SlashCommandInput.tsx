/**
 * Slash Command Input Component
 *
 * Wrapper around regular Input component that adds slash command functionality.
 * Detects slash commands, searches templates, and shows autocomplete dropdown.
 *
 * Used for plain text inputs (e.g., InternalChatPage) where Lexical editor isn't used.
 *
 * Features:
 * - Detects '/' followed by text (no spaces)
 * - Debounced template search
 * - Keyboard navigation (arrows, enter, escape)
 * - Inserts template content at slash position
 * - Tracks template usage
 */

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { searchTemplates, trackTemplateUsage, TemplateSearchResult } from '@/services/messageTemplateService';

interface SlashCommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SlashCommandInput: React.FC<SlashCommandInputProps> = ({
  value,
  onChange,
  onKeyPress,
  placeholder,
  disabled,
  className,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [query, setQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [slashPosition, setSlashPosition] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Handle input change and detect slash commands
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user is typing a slash command
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastSlash = textBeforeCursor.lastIndexOf('/');

    if (lastSlash !== -1) {
      const textAfterSlash = textBeforeCursor.slice(lastSlash + 1);

      // Check if there's no space after slash (still typing the command)
      if (!textAfterSlash.includes(' ')) {
        setQuery(textAfterSlash);
        setSlashPosition(lastSlash);
        setShowTemplates(true);
        return;
      }
    }

    setShowTemplates(false);
    setQuery('');
  };

  // Insert template at slash position
  const insertTemplate = (template: TemplateSearchResult) => {
    if (slashPosition === -1) return;

    const textBeforeSlash = value.slice(0, slashPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const newValue = textBeforeSlash + template.content + textAfterCursor;

    onChange(newValue);

    // Track usage
    trackTemplateUsage(template.id).catch(console.error);

    // Reset state
    setShowTemplates(false);
    setQuery('');
    setSlashPosition(-1);

    // Set cursor position after template
    const newCursorPos = textBeforeSlash.length + template.content.length;
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showTemplates && templates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % templates.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + templates.length) % templates.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertTemplate(templates[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowTemplates(false);
        setQuery('');
        return;
      }
    }

    // Pass through other key events (like Enter for sending)
    if (e.key === 'Enter' && onKeyPress) {
      onKeyPress(e);
    }
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />

      {/* Template autocomplete dropdown */}
      {showTemplates && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
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
      )}
    </div>
  );
};
