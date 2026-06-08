import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  users: User[];
  className?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onKeyPress,
  placeholder,
  disabled,
  users,
  className,
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // Filter users based on mention query
  const filteredUsers = users.filter((user) => {
    const searchStr = mentionQuery.toLowerCase();
    const firstName = user.first_name?.toLowerCase() || '';
    const lastName = user.last_name?.toLowerCase() || '';
    const email = user.email.toLowerCase();
    return firstName.includes(searchStr) || lastName.includes(searchStr) || email.includes(searchStr);
  }).slice(0, 5); // Show max 5 suggestions

  useEffect(() => {
    // Reset selected index when filtered users change
    setSelectedIndex(0);
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user is typing a mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      // Check if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      // Create mention format: @FirstName (which will be converted to @user:123 on submit)
      const mentionText = `@${user.first_name || user.email.split('@')[0]}`;
      const newValue =
        textBeforeCursor.slice(0, lastAtSymbol) +
        mentionText +
        ' ' +
        textAfterCursor;

      onChange(newValue);

      // Store the user ID mapping (we'll handle this in the parent component)
      // For now, we'll use a data attribute approach
      const newCursorPos = lastAtSymbol + mentionText.length + 1;
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    setShowMentions(false);
    setMentionQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && onKeyPress) {
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

      {/* Mention autocomplete dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionListRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
        >
          <div className="max-h-60 overflow-y-auto">
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left',
                  index === selectedIndex && 'bg-slate-100 dark:bg-slate-700'
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.profile_picture_url} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-indigo-500 text-white">
                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email}
                  </p>
                  {user.first_name && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MentionInput;
