import { useEffect, useRef, useCallback } from 'react';

const useWebSocket = (matchId, onMessage) => {
  const ws = useRef(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?matchId=${matchId}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(connect, 5000);
    };
  }, [matchId, onMessage]);

  useEffect(() => {
    if (matchId) {
      connect();
    }

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [matchId, connect]);

  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  return { sendMessage };
};

export default useWebSocket; 