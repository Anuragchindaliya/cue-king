import { useEffect, useRef, useState } from 'react';

interface UseSSEProps {
  url: string;
  token?: string | null;
  events: Record<string, (data: any) => void>;
}

export function useSSE({ url, token, events }: UseSSEProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventsRef = useRef(events);

  // Keep events updated without re-triggering connection
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!url) return;

    // Append token if present
    const sseUrl = new URL(url);
    if (token) {
      sseUrl.searchParams.set('token', token);
    }

    const eventSource = new EventSource(sseUrl.toString());

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log(`SSE connection opened to: ${url}`);
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError(err);
      console.error(`SSE connection error on: ${url}`, err);
    };

    // Attach listeners for all declared events
    const attachedListeners = Object.entries(eventsRef.current).map(([eventName, callback]) => {
      const listener = (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          callback(parsed);
        } catch (err) {
          console.error(`SSE: Failed to parse event data for ${eventName}`, err);
          callback(event.data);
        }
      };

      eventSource.addEventListener(eventName, listener);
      return { eventName, listener };
    });

    return () => {
      // Detach listeners and close stream
      attachedListeners.forEach(({ eventName, listener }) => {
        eventSource.removeEventListener(eventName, listener);
      });
      eventSource.close();
      setIsConnected(false);
      console.log(`SSE connection closed to: ${url}`);
    };
  }, [url, token]);

  return { isConnected, error };
}
