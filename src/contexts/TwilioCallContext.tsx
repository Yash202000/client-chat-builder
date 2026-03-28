import { createContext, useContext, ReactNode } from 'react';
import { useTwilioDevice, TwilioDeviceHook } from '@/hooks/useTwilioDevice';

const TwilioCallContext = createContext<TwilioDeviceHook | null>(null);

export function TwilioCallProvider({ children }: { children: ReactNode }) {
  const device = useTwilioDevice();
  return (
    <TwilioCallContext.Provider value={device}>
      {children}
    </TwilioCallContext.Provider>
  );
}

export function useTwilioCall(): TwilioDeviceHook {
  const ctx = useContext(TwilioCallContext);
  if (!ctx) throw new Error('useTwilioCall must be used inside TwilioCallProvider');
  return ctx;
}
