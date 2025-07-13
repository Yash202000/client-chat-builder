import { useState, useEffect, useRef } from 'react';

interface WebSocketOptions {
  onOpen?: () => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (url: string | null, options: WebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (url) {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        if (options.onOpen) {
          options.onOpen();
        }
      };

      ws.current.onmessage = (event) => {
        if (options.onMessage) {
          options.onMessage(event);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        if (options.onClose) {
          options.onClose();
        }
      };

      ws.current.onerror = (error) => {
        if (options.onError) {
          options.onError(error);
        }
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [url]);

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.error('WebSocket is not connected.');
    }
  };

  return { isConnected, sendMessage };
};
