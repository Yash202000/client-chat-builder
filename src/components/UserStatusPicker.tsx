import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown, CircleUser, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateUserStatus } from '@/services/chatService';
import { useToast } from '@/components/ui/use-toast';
import { AccentPicker } from '@/components/AccentPicker';
import { Link } from 'react-router-dom';

interface UserStatusPickerProps {
  user?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_picture_url?: string;
    presence_status?: string;
    status_message?: string;
  };
  onStatusChange?: (newStatus: string, message?: string) => void;
  onLogout?: () => void;
  /** Render only the avatar + status dot (no name row) — for use in the header */
  compact?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'online', label: 'Active', dot: 'bg-green-500', desc: 'Available for messages and calls' },
  { value: 'busy', label: 'Busy', dot: 'bg-amber-500', desc: 'Will reply when available' },
  { value: 'dnd', label: 'Do Not Disturb', dot: 'bg-red-500', desc: 'Suppress all notifications' },
  { value: 'offline', label: 'Appear Offline', dot: 'bg-slate-400', desc: 'Show as offline to others' },
];

const DND_DURATIONS = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: 'Today', minutes: getMinutesUntilEndOfDay() },
  { label: 'Until I clear it', minutes: 60 * 24 * 30 },
];

function getMinutesUntilEndOfDay() {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return Math.floor((endOfDay.getTime() - now.getTime()) / 60000);
}

const statusDotClass = (status?: string) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'busy': return 'bg-amber-500';
    case 'dnd': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
};

const UserStatusPicker: React.FC<UserStatusPickerProps> = ({ user, onStatusChange, onLogout, compact }) => {
  const [open, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(user?.status_message || '');
  const [selectedStatus, setSelectedStatus] = useState(user?.presence_status || 'online');
  const [showDndOptions, setShowDndOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const displayName = user?.first_name || user?.email?.split('@')[0] || 'You';
  const initials = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const handleSave = async (status = selectedStatus, dndMinutes?: number) => {
    setIsSaving(true);
    try {
      await updateUserStatus({
        presence_status: status,
        status_message: statusMessage,
        dnd_minutes: dndMinutes,
      });
      onStatusChange?.(status, statusMessage);
      toast({ title: 'Status updated' });
      setOpen(false);
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusClick = (status: string) => {
    if (status === 'dnd') {
      setSelectedStatus('dnd');
      setShowDndOptions(true);
    } else {
      setSelectedStatus(status);
      setShowDndOptions(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <button className="relative flex items-center justify-center h-7 w-7 rounded-full hover:ring-2 hover:ring-primary/30 transition-all" title={displayName}>
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.profile_picture_url} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
              statusDotClass(user?.presence_status || 'online')
            )} />
          </button>
        ) : (
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors w-full text-left group">
            <div className="relative flex-shrink-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.profile_picture_url} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                statusDotClass(user?.presence_status || 'online')
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
              {user?.status_message ? (
                <p className="text-[10px] text-muted-foreground truncate">{user.status_message}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground capitalize">{user?.presence_status || 'online'}</p>
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" side={compact ? 'bottom' : 'top'} className="w-72 p-0 overflow-hidden">
        {/* Header */}
        <div className="px-3 py-3 border-b border-border">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.profile_picture_url} />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-popover', statusDotClass(user?.presence_status || 'online'))} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Input
            placeholder="What's your status?"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            className="h-7 text-xs"
            maxLength={80}
          />
        </div>

        {/* Status options */}
        <div className="py-1">
          {showDndOptions ? (
            <>
              <div className="px-3 py-1.5">
                <button
                  onClick={() => setShowDndOptions(false)}
                  className="text-xs text-primary hover:underline"
                >
                  ← Back
                </button>
                <p className="text-xs font-medium text-foreground mt-1">Do Not Disturb for:</p>
              </div>
              {DND_DURATIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSave('dnd', opt.minutes)}
                  className="w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground text-left transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </>
          ) : (
            STATUS_OPTIONS.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusClick(opt.value)}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors',
                    isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0 mt-1', opt.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />}
                </button>
              );
            })
          )}
        </div>

        {!showDndOptions && (
          <>
            <div className="px-3 py-2 border-t border-border">
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => handleSave()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save status'}
              </Button>
            </div>

            {/* Accent picker */}
            <div className="border-t border-border">
              <AccentPicker />
            </div>

            {/* Profile + Logout */}
            <div className="border-t border-border py-1">
              <Link
                to="/dashboard/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <CircleUser className="h-3.5 w-3.5 text-muted-foreground" />
                View profile
              </Link>
              {onLogout && (
                <button
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default UserStatusPicker;
