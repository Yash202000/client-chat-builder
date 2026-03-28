import { useState, useEffect, useRef, useCallback } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { useAuth } from './useAuth';

export type CallState = 'idle' | 'connecting' | 'ringing' | 'in-call' | 'error';

export interface ActiveCallInfo {
  toNumber: string;
  contactName: string;
  conversationId: string;
  contactId: number;
}

export interface TwilioDeviceHook {
  callState: CallState;
  activeCallInfo: ActiveCallInfo | null;
  duration: number;
  isMuted: boolean;
  makeCall: (toNumber: string, contactId?: number) => Promise<void>;
  hangup: () => void;
  toggleMute: () => void;
  error: string | null;
}

export function useTwilioDevice(): TwilioDeviceHook {
  const { authFetch } = useAuth();
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCallInfo, setActiveCallInfo] = useState<ActiveCallInfo | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimer = useCallback(() => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);
  }, []);

  const cleanupCall = useCallback(() => {
    stopTimer();
    callRef.current = null;
    setCallState('idle');
    setActiveCallInfo(null);
    setIsMuted(false);
    setError(null);
  }, [stopTimer]);

  const initDevice = useCallback(async (): Promise<Device> => {
    if (deviceRef.current) return deviceRef.current;

    const res = await authFetch('/api/v1/twilio/token');
    if (!res.ok) throw new Error('Failed to fetch Twilio token');
    const { token } = await res.json();

    const device = new Device(token, { logLevel: 1 });

    device.on('error', (err) => {
      console.error('Twilio Device error:', err);
      setError(err.message || 'Call error');
      cleanupCall();
    });

    device.on('tokenWillExpire', async () => {
      try {
        const r = await authFetch('/api/v1/twilio/token');
        if (r.ok) {
          const { token: newToken } = await r.json();
          device.updateToken(newToken);
        }
      } catch (e) {
        console.error('Failed to refresh Twilio token', e);
      }
    });

    await device.register();
    deviceRef.current = device;
    return device;
  }, [authFetch, cleanupCall]);

  const makeCall = useCallback(async (toNumber: string, contactId?: number) => {
    try {
      setError(null);
      setCallState('connecting');

      // Register the outbound session on the backend
      const sessionRes = await authFetch('/api/v1/twilio/outbound-call', {
        method: 'POST',
        body: JSON.stringify({ to_number: toNumber, contact_id: contactId }),
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to prepare outbound call');
      }

      const sessionData = await sessionRes.json();

      setActiveCallInfo({
        toNumber,
        contactName: sessionData.contact_name || toNumber,
        conversationId: sessionData.conversation_id,
        contactId: sessionData.contact_id,
      });

      const device = await initDevice();

      const call = await device.connect({
        params: { To: toNumber },
      });

      callRef.current = call;

      call.on('ringing', () => setCallState('ringing'));

      call.on('accept', () => {
        setCallState('in-call');
        startTimer();
      });

      call.on('disconnect', () => cleanupCall());

      call.on('cancel', () => cleanupCall());

      call.on('error', (err) => {
        setError(err.message || 'Call failed');
        cleanupCall();
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start call');
      setCallState('error');
      setTimeout(() => setCallState('idle'), 3000);
    }
  }, [authFetch, initDevice, startTimer, cleanupCall]);

  const hangup = useCallback(() => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
    cleanupCall();
  }, [cleanupCall]);

  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const next = !isMuted;
      callRef.current.mute(next);
      setIsMuted(next);
    }
  }, [isMuted]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (callRef.current) callRef.current.disconnect();
      if (deviceRef.current) deviceRef.current.destroy();
    };
  }, [stopTimer]);

  return { callState, activeCallInfo, duration, isMuted, makeCall, hangup, toggleMute, error };
}
