"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type SSEEventType = "connected" | "booking:created" | "booking:cancelled" | "booking:updated";

interface SSEEventData {
  bookingId?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
  clientId?: string;
}

interface UseSSEOptions {
  onBookingCreated?: (data: SSEEventData) => void;
  onBookingCancelled?: (data: SSEEventData) => void;
  onBookingUpdated?: (data: SSEEventData) => void;
  enabled?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const {
    onBookingCreated,
    onBookingCancelled,
    onBookingUpdated,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/sse");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE: Connected");
      reconnectAttempts.current = 0;
    };

    eventSource.onerror = (error) => {
      console.error("SSE: Error", error);
      eventSource.close();

      // Attempt reconnection with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`SSE: Reconnecting in ${delay}ms...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    // Handle connected event
    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      console.log("SSE: Client ID:", data.clientId);
    });

    // Handle booking created
    eventSource.addEventListener("booking:created", (event) => {
      const data: SSEEventData = JSON.parse(event.data);
      console.log("SSE: Booking created", data);
      
      // Invalidate booking queries to refetch
      queryClient.invalidateQueries({ queryKey: [["bookings"]] });
      
      onBookingCreated?.(data);
    });

    // Handle booking cancelled
    eventSource.addEventListener("booking:cancelled", (event) => {
      const data: SSEEventData = JSON.parse(event.data);
      console.log("SSE: Booking cancelled", data);
      
      // Invalidate booking queries to refetch
      queryClient.invalidateQueries({ queryKey: [["bookings"]] });
      
      onBookingCancelled?.(data);
    });

    // Handle booking updated
    eventSource.addEventListener("booking:updated", (event) => {
      const data: SSEEventData = JSON.parse(event.data);
      console.log("SSE: Booking updated", data);
      
      // Invalidate booking queries to refetch
      queryClient.invalidateQueries({ queryKey: [["bookings"]] });
      
      onBookingUpdated?.(data);
    });
  }, [enabled, queryClient, onBookingCreated, onBookingCancelled, onBookingUpdated]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    reconnect: connect,
  };
}

