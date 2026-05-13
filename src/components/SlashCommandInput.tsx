import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, AtSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { searchTemplates, trackTemplateUsage, TemplateSearchResult } from '@/services/messageTemplateService';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

interface SlashCommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  users?: User[];
}

export const SlashCommandInput: React.FC<SlashCommandInputProps> = ({
  value,
  onChange,
  onKeyPress,
  placeholder,
  disabled,
  className,
  users = [],
}) => {
  // Slash command state
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateQuery, setTemplateQuery] = useState('');
  const [templates, setTemplates] = useState<TemplateSearchResult[]>([]);
  const [templateSelectedIndex, setTemplateSelectedIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState(-1);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(-1);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);

  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateDropdownRect = useCallback(() => {
    if (inputRef.current) setDropdownRect(inputRef.current.getBoundingClientRect());
  }, []);

  // Filter users for mention suggestions
  const filteredUsers = users
    .filter((u) => {
      const q = mentionQuery.toLowerCase();
      return (
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  // Debounced template search
  useEffect(() => {
    if (!templateQuery) { setTemplates([]); return; }
    const t = setTimeout(async () => {
      setIsLoadingTemplates(true);
      try {
        setTemplates(await searchTemplates(templateQuery, 10));
        setTemplateSelectedIndex(0);
      } catch { setTemplates([]); }
      finally { setIsLoadingTemplates(false); }
    }, 150);
    return () => clearTimeout(t);
  }, [templateQuery]);

  useEffect(() => { setMentionSelectedIndex(0); }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);
    setCursorPosition(cursorPos);

    const textBeforeCursor = newValue.slice(0, cursorPos);

    // --- @ mention detection (takes priority) ---
    const lastAt = textBeforeCursor.lastIndexOf('@');
    if (lastAt !== -1) {
      const afterAt = textBeforeCursor.slice(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setMentionQuery(afterAt);
        setMentionPosition(lastAt);
        setShowMentions(true);
        setShowTemplates(false);
        updateDropdownRect();
        return;
      }
    }
    setShowMentions(false);

    // --- / slash command detection ---
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    if (lastSlash !== -1) {
      const afterSlash = textBeforeCursor.slice(lastSlash + 1);
      if (!afterSlash.includes(' ')) {
        setTemplateQuery(afterSlash);
        setSlashPosition(lastSlash);
        setShowTemplates(true);
        updateDropdownRect();
        return;
      }
    }
    setShowTemplates(false);
    setTemplateQuery('');
  };

  const insertMention = (user: User) => {
    const displayName = user.first_name || user.email.split('@')[0];
    const mentionText = `@${displayName}`;
    const newValue =
      value.slice(0, mentionPosition) + mentionText + ' ' + value.slice(cursorPosition);
    onChange(newValue);
    setShowMentions(false);
    setMentionQuery('');
    const newCursor = mentionPosition + mentionText.length + 1;
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertTemplate = (template: TemplateSearchResult) => {
    if (slashPosition === -1) return;
    const newValue = value.slice(0, slashPosition) + template.content + value.slice(cursorPosition);
    onChange(newValue);
    trackTemplateUsage(template.id).catch(console.error);
    setShowTemplates(false);
    setTemplateQuery('');
    setSlashPosition(-1);
    const newCursor = slashPosition + template.content.length;
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionSelectedIndex((i) => (i + 1) % filteredUsers.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionSelectedIndex((i) => (i - 1 + filteredUsers.length) % filteredUsers.length); return; }
      if (e.key === 'Enter') { e.preventDefault(); insertMention(filteredUsers[mentionSelectedIndex]); return; }
      if (e.key === 'Escape') { setShowMentions(false); return; }
    }

    if (showTemplates && templates.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setTemplateSelectedIndex((i) => (i + 1) % templates.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setTemplateSelectedIndex((i) => (i - 1 + templates.length) % templates.length); return; }
      if (e.key === 'Enter') { e.preventDefault(); insertTemplate(templates[templateSelectedIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setShowTemplates(false); setTemplateQuery(''); return; }
    }

    if (e.key === 'Enter' && onKeyPress) onKeyPress(e);
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

      {/* @ Mention dropdown — portal so it escapes overflow:hidden parents */}
      {showMentions && dropdownRect && createPortal(
        <div
          className="fixed z-[9990] w-72 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
          style={{
            left: dropdownRect.left,
            top: dropdownRect.top - 8,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
            <AtSign className="h-3 w-3 text-violet-500" />
            <span className="text-xs font-semibold text-muted-foreground">Mention someone</span>
          </div>
          {filteredUsers.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground text-center">No members found</div>
          ) : (
            <div className="py-1">
              {filteredUsers.map((user, index) => (
                <button
                  key={user.id}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(user); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors',
                    index === mentionSelectedIndex ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-accent'
                  )}
                >
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={user.profile_picture_url} />
                    <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                      {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                    </p>
                    {user.first_name && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* / Slash command dropdown — portal so it escapes overflow:hidden parents */}
      {showTemplates && dropdownRect && createPortal(
        <div
          className="fixed z-[9990] w-[480px] max-w-[90vw] bg-popover border border-border rounded-xl shadow-xl"
          style={{
            left: dropdownRect.left,
            top: dropdownRect.top - 8,
            transform: 'translateY(-100%)',
          }}
        >
          {isLoadingTemplates ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {templateQuery ? 'No templates found' : 'Start typing to search templates'}
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="p-2">
                <div className="text-xs font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Message Templates
                </div>
                {templates.map((template, index) => (
                  <button
                    key={template.id}
                    onMouseDown={(e) => { e.preventDefault(); insertTemplate(template); }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md transition-colors',
                      index === templateSelectedIndex
                        ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-violet-500'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">/{template.shortcut}</span>
                          <span className="text-xs text-muted-foreground">{template.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.preview}</p>
                        {template.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {template.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {template.scope === 'shared' && (
                        <Badge variant="outline" className="text-xs shrink-0">Shared</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
