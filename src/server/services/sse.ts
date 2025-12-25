// Server-Sent Events service for real-time updates

type EventType = "booking:created" | "booking:cancelled" | "booking:updated";

interface SSEEvent {
  type: EventType;
  data: {
    bookingId: string;
    userId: string;
    startTime: string;
    endTime: string;
  };
}

// Store active connections
const clients = new Map<string, ReadableStreamDefaultController>();

export function addClient(clientId: string, controller: ReadableStreamDefaultController) {
  clients.set(clientId, controller);
  console.log(`SSE: Client ${clientId} connected. Total clients: ${clients.size}`);
}

export function removeClient(clientId: string) {
  clients.delete(clientId);
  console.log(`SSE: Client ${clientId} disconnected. Total clients: ${clients.size}`);
}

export function broadcastEvent(event: SSEEvent) {
  const eventString = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(eventString);

  let sentCount = 0;
  clients.forEach((controller, clientId) => {
    try {
      controller.enqueue(encoded);
      sentCount++;
    } catch (error) {
      // Client disconnected, remove from map
      console.log(`SSE: Failed to send to client ${clientId}, removing`);
      clients.delete(clientId);
    }
  });

  console.log(`SSE: Broadcasted ${event.type} to ${sentCount} clients`);
}

// Helper functions for specific events
export function broadcastBookingCreated(booking: {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
}) {
  broadcastEvent({
    type: "booking:created",
    data: {
      bookingId: booking.id,
      userId: booking.userId,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  });
}

export function broadcastBookingCancelled(booking: {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
}) {
  broadcastEvent({
    type: "booking:cancelled",
    data: {
      bookingId: booking.id,
      userId: booking.userId,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  });
}

export function broadcastBookingUpdated(booking: {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
}) {
  broadcastEvent({
    type: "booking:updated",
    data: {
      bookingId: booking.id,
      userId: booking.userId,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  });
}

