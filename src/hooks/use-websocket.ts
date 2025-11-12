import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketOptions {
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
  reconnectInterval?: number; // milliseconds between reconnection attempts
  maxReconnectAttempts?: number; // maximum number of reconnection attempts
  heartbeatInterval?: number; // milliseconds between heartbeat pings
}

export const useWebSocket = (url: string | null, options: WebSocketOptions = {}) => {
  const {
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000, // 30 seconds
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnect = useRef(true);
  const isManualClose = useRef(false);
  const reconnectAttempts = useRef(0);
  const urlRef = useRef(url);
  const optionsRef = useRef(options);

  // Update refs when props change
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
    clearTimers();
    heartbeatTimer.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Send ping message to keep connection alive
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, clearTimers]);

  const connect = useCallback(() => {
    const currentUrl = urlRef.current;
    const currentOptions = optionsRef.current;

    if (!currentUrl || !enabled) return;

    // Close existing connection if any
    if (ws.current) {
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        console.log('[WebSocket] Closing existing connection before creating new one');
        ws.current.close();
      }
    }

    try {
      console.log('[WebSocket] Connecting to:', currentUrl);
      ws.current = new WebSocket(currentUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        setReconnectCount(0);
        startHeartbeat();
        if (currentOptions.onOpen) {
          currentOptions.onOpen();
        }
      };

      ws.current.onmessage = (event) => {
        if (currentOptions.onMessage) {
          currentOptions.onMessage(event);
        }
      };

      ws.current.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setIsConnected(false);
        clearTimers();

        if (currentOptions.onClose) {
          currentOptions.onClose();
        }

        // Attempt to reconnect if not manually closed
        if (shouldReconnect.current && !isManualClose.current && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.min(reconnectAttempts.current + 1, 5); // Exponential backoff (capped at 5x)
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

          reconnectAttempts.current += 1;
          setReconnectCount(reconnectAttempts.current);

          reconnectTimer.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        if (currentOptions.onError) {
          currentOptions.onError(error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [enabled, maxReconnectAttempts, reconnectInterval, startHeartbeat, clearTimers]);

  useEffect(() => {
    if (url && enabled) {
      shouldReconnect.current = true;
      isManualClose.current = false;
      reconnectAttempts.current = 0;
      connect();
    }

    return () => {
      shouldReconnect.current = false;
      isManualClose.current = true;
      clearTimers();
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, enabled]); // Removed 'connect' from dependencies to prevent loop

  const sendMessage = useCallback((message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.error('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    isManualClose.current = true;
    clearTimers();
    if (ws.current) {
      ws.current.close();
    }
  }, [clearTimers]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    setReconnectCount(0);
    shouldReconnect.current = true;
    isManualClose.current = false;
    clearTimers();
    if (ws.current) {
      ws.current.close();
    }
    setTimeout(() => connect(), 100);
  }, [connect, clearTimers]);

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect,
    reconnectCount
  };
};
