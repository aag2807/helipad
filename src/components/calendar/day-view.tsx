"use client";

import { useMemo } from "react";
import { format, isBefore, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { generateTimeSlots, getSlotDateTime } from "@/hooks/use-calendar";

interface Booking {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  purpose: string;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface DayViewProps {
  date: Date;
  bookings: Booking[];
  currentUserId: string;
  startHour?: number;
  endHour?: number;
  onSlotClick: (date: Date, hour: number, minute: number) => void;
  onBookingClick: (booking: Booking) => void;
}

export function DayView({
  date,
  bookings,
  currentUserId,
  startHour = 6,
  endHour = 22,
  onSlotClick,
  onBookingClick,
}: DayViewProps) {
  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, 30),
    [startHour, endHour]
  );

  const getBookingsForSlot = (hour: number, minute: number) => {
    const slotStart = getSlotDateTime(date, hour, minute);
    const slotEnd = getSlotDateTime(date, hour, minute + 30);

    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);

      return (
        booking.status === "confirmed" &&
        (isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd }) ||
          isWithinInterval(bookingStart, { start: slotStart, end: slotEnd }) ||
          (bookingStart <= slotStart && bookingEnd >= slotEnd))
      );
    });
  };

  const now = new Date();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-violet-50 border-b border-violet-100">
        <h3 className="font-semibold text-violet-900">
          {format(date, "EEEE, MMMM d, yyyy")}
        </h3>
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
        {timeSlots.map((slot) => {
          const slotDateTime = getSlotDateTime(date, slot.hour, slot.minute);
          const isPast = isBefore(slotDateTime, now);
          const slotBookings = getBookingsForSlot(slot.hour, slot.minute);
          const hasBooking = slotBookings.length > 0;

          return (
            <div
              key={`${slot.hour}-${slot.minute}`}
              className={cn(
                "flex border-b border-zinc-100 last:border-b-0",
                slot.minute === 0 && "border-t border-zinc-200"
              )}
            >
              {/* Time label */}
              <div className="w-16 py-3 pr-3 text-[11px] font-medium text-zinc-400 bg-zinc-50/50 shrink-0 flex items-center justify-end">
                {slot.minute === 0 && slot.label}
              </div>

              {/* Slot content */}
              <div
                className={cn(
                  "flex-1 min-h-[48px] p-2 transition-colors",
                  isPast
                    ? "bg-zinc-50/50"
                    : hasBooking
                    ? ""
                    : "hover:bg-emerald-50 cursor-pointer"
                )}
                onClick={() => {
                  if (!isPast && !hasBooking) {
                    onSlotClick(date, slot.hour, slot.minute);
                  }
                }}
              >
                {slotBookings.map((booking) => {
                  const bookingStart = new Date(booking.startTime);
                  const bookingEnd = new Date(booking.endTime);
                  const isStartSlot =
                    bookingStart.getHours() === slot.hour &&
                    bookingStart.getMinutes() === slot.minute;

                  if (!isStartSlot) {
                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "h-full rounded-lg",
                          booking.userId === currentUserId
                            ? "bg-violet-100"
                            : "bg-zinc-100"
                        )}
                      />
                    );
                  }

                  return (
                    <button
                      key={booking.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick(booking);
                      }}
                      className={cn(
                        "w-full rounded-lg p-3 text-left transition-all hover:ring-2 hover:ring-offset-1",
                        booking.userId === currentUserId
                          ? "bg-violet-100 text-violet-800 hover:ring-violet-300"
                          : "bg-zinc-100 text-zinc-700 hover:ring-zinc-300"
                      )}
                    >
                      <div className="font-semibold">
                        {booking.user
                          ? `${booking.user.firstName} ${booking.user.lastName}`
                          : "Booked"}
                      </div>
                      <div className="text-sm opacity-75 mt-1">
                        {format(bookingStart, "h:mm a")} -{" "}
                        {format(bookingEnd, "h:mm a")}
                      </div>
                      <div className="text-sm mt-1 truncate">
                        {booking.purpose}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

