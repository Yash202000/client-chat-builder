import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '@/services/notificationService';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';

interface NotificationBellProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { soundEnabled, enableSound, disableSound } = useNotifications();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Fetch unread count (no polling - updated via WebSocket)
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notificationUnreadCount'],
    queryFn: getUnreadCount,
    // Removed refetchInterval - now updated via WebSocket push notifications
  });

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(false),
    enabled: isOpen,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return '💬';
      case 'reply':
        return '↩️';
      case 'reaction':
        return '👍';
      case 'missed_call':
        return '📵';
      case 'call_rejected':
        return '📞';
      default:
        return '🔔';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'relative hover:bg-muted dark:border-white/[0.12] dark:text-white rounded-full',
            className
          )}
        >
          <Bell className="h-5 w-5 text-muted-foreground dark:text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align={isRTL ? "start" : "end"} dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{t('conversations.notifications.title', 'Notifications')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                soundEnabled ? disableSound() : enableSound();
              }}
              className="p-1 h-8 w-8"
              title={soundEnabled ? t('conversations.notifications.disableSound', 'Disable notification sounds') : t('conversations.notifications.enableSound', 'Enable notification sounds')}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isLoading}
              className="text-xs"
            >
              <CheckCheck className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('conversations.notifications.markAllRead', 'Mark all read')}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 text-muted-foreground/25" />
              <p className="text-sm">{t('conversations.notifications.empty', 'No notifications')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/40 dark:hover:bg-white/[0.04] transition-colors cursor-pointer relative group',
                    !notification.is_read && 'bg-violet-50/60 dark:bg-white/[0.03]'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/55">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a', { locale: isRTL ? ar : undefined })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400 flex-shrink-0 mt-2"></div>
                    )}
                  </div>

                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotificationMutation.mutate(notification.id);
                    }}
                    className={cn(
                      "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted dark:hover:bg-white/[0.08]",
                      isRTL ? "left-2" : "right-2"
                    )}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
