"use client";

import { useMemo } from "react";
import { format, isSameDay, isToday, isBefore, isWithinInterval } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateTimeSlots, getSlotDateTime } from "@/hooks/use-calendar";
import { useTranslations } from "@/hooks/use-translations";

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

interface WeekViewProps {
  days: Date[];
  bookings: Booking[];
  currentUserId: string;
  startHour?: number;
  endHour?: number;
  onSlotClick: (date: Date, hour: number, minute: number) => void;
  onBookingClick: (booking: Booking) => void;
}

export function WeekView({
  days,
  bookings,
  currentUserId,
  startHour = 6,
  endHour = 22,
  onSlotClick,
  onBookingClick,
}: WeekViewProps) {
  const { t, locale } = useTranslations();
  const dateLocale = locale === "es" ? es : enUS;

  const timeSlots = useMemo(
    () => generateTimeSlots(startHour, endHour, 60),
    [startHour, endHour]
  );

  const getBookingsForSlot = (date: Date, hour: number) => {
    const slotStart = getSlotDateTime(date, hour, 0);
    const slotEnd = getSlotDateTime(date, hour + 1, 0);

    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      return (
        (booking.status === "confirmed" || booking.status === "pending") &&
        (isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd }) ||
          isWithinInterval(bookingStart, { start: slotStart, end: slotEnd }) ||
          (bookingStart <= slotStart && bookingEnd >= slotEnd))
      );
    });
  };

  const now = new Date();

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-200">
        <div className="p-2 bg-zinc-50" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-3 text-center border-l border-zinc-200",
              isToday(day) && "bg-violet-50"
            )}
          >
            <div className="text-xs text-zinc-500 uppercase">
              {format(day, "EEE", { locale: dateLocale })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold mt-1",
                isToday(day)
                  ? "w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center mx-auto"
                  : "text-zinc-900"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
        {timeSlots.map((slot) => (
          <div
            key={`${slot.hour}-${slot.minute}`}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-zinc-100 last:border-b-0"
          >
            {/* Time label */}
            <div className="p-2 text-xs text-zinc-400 text-right pr-3 bg-zinc-50/50">
              {slot.label}
            </div>

            {/* Day cells */}
            {days.map((day) => {
              const slotDateTime = getSlotDateTime(day, slot.hour, slot.minute);
              const isPast = isBefore(slotDateTime, now);
              const slotBookings = getBookingsForSlot(day, slot.hour);
              const hasBooking = slotBookings.length > 0;
              const isMyBooking = slotBookings.some(
                (b) => b.userId === currentUserId
              );

              return (
                <div
                  key={`${day.toISOString()}-${slot.hour}`}
                  className={cn(
                    "relative min-h-[48px] border-l border-zinc-100 transition-colors",
                    isPast
                      ? "bg-zinc-50/50"
                      : hasBooking
                      ? ""
                      : "hover:bg-emerald-50 cursor-pointer"
                  )}
                  onClick={() => {
                    if (!isPast && !hasBooking) {
                      onSlotClick(day, slot.hour, slot.minute);
                    }
                  }}
                >
                  {slotBookings.map((booking) => {
                    const bookingStart = new Date(booking.startTime);
                    const isStartSlot =
                      bookingStart.getHours() === slot.hour &&
                      isSameDay(bookingStart, day);

                    if (!isStartSlot) return null;

                    const bookingEnd = new Date(booking.endTime);
                    const durationHours =
                      (bookingEnd.getTime() - bookingStart.getTime()) /
                      (1000 * 60 * 60);
                    
                    const isOwnBooking = booking.userId === currentUserId;
                    const canViewDetails = isOwnBooking; // Only owner can see details (admin will see details elsewhere)

                    return (
                      <button
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canViewDetails) {
                            onBookingClick(booking);
                          }
                        }}
                        className={cn(
                          "absolute inset-x-1 rounded-lg p-2 text-left text-xs font-medium transition-all z-10",
                          booking.status === "pending"
                            ? "bg-amber-100 text-amber-800 border-2 border-amber-300 border-dashed"
                            : isOwnBooking
                            ? "bg-violet-100 text-violet-800 hover:ring-2 hover:ring-offset-1 hover:ring-violet-300 cursor-pointer"
                            : "bg-zinc-100 text-zinc-700 cursor-default"
                        )}
                        style={{
                          top: "2px",
                          height: `calc(${durationHours * 100}% - 4px)`,
                          minHeight: "40px",
                        }}
                      >
                        <div className="font-semibold truncate">
                          {isOwnBooking 
                            ? `${booking.user?.firstName || "You"} ${booking.user?.lastName?.[0] || ""}.`
                            : t("calendar.booked")}
                          {booking.status === "pending" && " (Pending)"}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
                          {format(bookingStart, "h:mm a")} -{" "}
                          {format(bookingEnd, "h:mm a")}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

