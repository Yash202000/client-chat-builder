import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const { toast } = useToast();
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const callEndAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {

    // Check if browser supports notifications
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Initialize notification audio
    if (typeof window !== 'undefined') {
      notificationAudioRef.current = new Audio('/teams_notification.mp3');
      notificationAudioRef.current.preload = 'auto';

      successAudioRef.current = new Audio('/done.mp3');
      successAudioRef.current.preload = 'auto';

      callEndAudioRef.current = new Audio('/samsung_call_end.mp3');
      callEndAudioRef.current.preload = 'auto';
    }

    // Check if sound was previously enabled
    const savedSoundPreference = localStorage.getItem('notificationSoundEnabled');
    if (savedSoundPreference === 'true') {
      setSoundEnabled(true);
    }

    // Cleanup
    return () => {
      if (notificationAudioRef.current) {
        notificationAudioRef.current.pause();
        notificationAudioRef.current.currentTime = 0;
      }
      if (successAudioRef.current) {
        successAudioRef.current.pause();
        successAudioRef.current.currentTime = 0;
      }
      if (callEndAudioRef.current) {
        callEndAudioRef.current.pause();
        callEndAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const playBeep = async () => {

    if (!notificationAudioRef.current) {
      console.error('[NotificationSound] Notification audio not available');
      return;
    }

    try {
      const audio = notificationAudioRef.current;
      audio.currentTime = 0; // Reset to start
      await audio.play();
    } catch (error) {
      console.error('[NotificationSound] Error playing notification sound:', error);
    }
  };

  const playSuccessSound = async () => {

    // Only play if sound is enabled
    if (!soundEnabled) {
      return;
    }

    if (!successAudioRef.current) {
      console.error('[NotificationSound] Success audio not available');
      return;
    }

    try {
      const audio = successAudioRef.current;
      audio.currentTime = 0; // Reset to start
      await audio.play();
    } catch (error) {
      console.error('[NotificationSound] Error playing success sound:', error);
    }
  };

  const playCallEndSound = async () => {

    if (!callEndAudioRef.current) {
      console.error('[NotificationSound] Call end audio not available');
      return;
    }

    try {
      const audio = callEndAudioRef.current;
      audio.currentTime = 0; // Reset to start
      await audio.play();
    } catch (error) {
      console.error('[NotificationSound] Error playing call end sound:', error);
    }
  };

  const enableSound = async () => {
    // This function must be called from a user interaction (click, etc.)
    // to bypass browser autoplay policies

    try {
      // Play a test beep to unlock audio
      await playBeep();
      setSoundEnabled(true);
      localStorage.setItem('notificationSoundEnabled', 'true');
      return true;
    } catch (error) {
      console.error('[NotificationSound] Could not enable notification sound:', error);
      return false;
    }
  };

  const disableSound = () => {
    setSoundEnabled(false);
    localStorage.setItem('notificationSoundEnabled', 'false');
  };

  const showDesktopNotification = (options: NotificationOptions) => {
    // Don't show if permission is denied or not supported
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    // Don't show if tab is focused
    if (document.hasFocus()) {
      return null;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/logo.png',
      tag: options.tag,
      requireInteraction: false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        window.focus();
        options.onClick?.();
        notification.close();
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  };

  const playNotificationSound = async () => {

    // Only play if sound is enabled
    if (!soundEnabled) {
      return;
    }

    await playBeep();
  };

  const showToast = (options: NotificationOptions) => {
    toast({
      title: options.title,
      description: options.body,
    });
  };

  const showNotification = (options: NotificationOptions) => {
    // Play notification sound (if enabled)
    playNotificationSound();

    // Always show toast
    showToast(options);

    // Also show desktop notification if permitted and tab is not focused
    showDesktopNotification(options);
  };

  return {
    permission,
    soundEnabled,
    requestPermission,
    enableSound,
    disableSound,
    showNotification,
    showToast,
    showDesktopNotification,
    playNotificationSound,
    playSuccessSound,
    playCallEndSound,
  };
};
