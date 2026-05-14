import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export const useWebSocket = (url: string | null, options: WebSocketOptions = {}) => {
  const {
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const urlRef = useRef(url);
  const optionsRef = useRef(options);

  // Generation counter: incremented each time we start a fresh connection lifecycle
  // (URL change or manual reconnect). Captured per-connect so stale onclose/onerror
  // handlers can detect they've been superseded and must not trigger reconnect.
  const generation = useRef(0);

  useEffect(() => {
    urlRef.current = url;
    optionsRef.current = options;
  }, [url, options]);

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const connect = useCallback((myGeneration: number) => {
    const currentUrl = urlRef.current;
    const currentOptions = optionsRef.current;

    if (!currentUrl || !enabled) return;

    // Close any existing socket before opening a new one
    if (ws.current) {
      const s = ws.current;
      ws.current = null;
      // Nullify handlers so the stale socket doesn't fire callbacks after replacement
      s.onopen = null;
      s.onmessage = null;
      s.onclose = null;
      s.onerror = null;
      if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING) {
        s.close();
      }
    }

    try {
      const socket = new WebSocket(currentUrl);
      ws.current = socket;

      socket.onopen = () => {
        if (generation.current !== myGeneration) return; // superseded
        setIsConnected(true);
        reconnectAttempts.current = 0;
        setReconnectCount(0);
        startHeartbeat();
        currentOptions.onOpen?.();
      };

      socket.onmessage = (event) => {
        if (generation.current !== myGeneration) return; // superseded
        optionsRef.current.onMessage?.(event);
      };

      socket.onclose = () => {
        if (generation.current !== myGeneration) return; // superseded — do NOT reconnect
        setIsConnected(false);
        clearTimers();
        currentOptions.onClose?.();

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.min(reconnectAttempts.current + 1, 5);
          reconnectAttempts.current += 1;
          setReconnectCount(reconnectAttempts.current);
          reconnectTimer.current = setTimeout(() => {
            if (generation.current === myGeneration) {
              connect(myGeneration);
            }
          }, delay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      };

      socket.onerror = (error) => {
        if (generation.current !== myGeneration) return; // superseded
        console.error('[WebSocket] Error:', error);
        currentOptions.onError?.(error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [enabled, maxReconnectAttempts, reconnectInterval, startHeartbeat, clearTimers]);

  useEffect(() => {
    if (!url || !enabled) return;

    // Advance generation — any in-flight onclose/onerror for the old generation
    // will see a mismatch and skip their reconnect logic.
    const myGeneration = ++generation.current;
    reconnectAttempts.current = 0;

    const connectTimer = setTimeout(() => {
      connect(myGeneration);
    }, 100);

    return () => {
      clearTimeout(connectTimer);
      // Advance generation again so the socket we just opened (or are about to open)
      // knows it has been superseded by the cleanup.
      generation.current++;
      clearTimers();
      if (ws.current) {
        const s = ws.current;
        ws.current = null;
        s.onopen = null;
        s.onmessage = null;
        s.onclose = null;
        s.onerror = null;
        s.close();
      }
    };
  }, [url, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.error('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    generation.current++;
    clearTimers();
    if (ws.current) {
      const s = ws.current;
      ws.current = null;
      s.onopen = null;
      s.onmessage = null;
      s.onclose = null;
      s.onerror = null;
      s.close();
    }
    setIsConnected(false);
  }, [clearTimers]);

  const reconnect = useCallback(() => {
    generation.current++;
    reconnectAttempts.current = 0;
    setReconnectCount(0);
    clearTimers();
    const myGeneration = ++generation.current;
    setTimeout(() => connect(myGeneration), 100);
  }, [connect, clearTimers]);

  return { isConnected, sendMessage, disconnect, reconnect, reconnectCount };
};
