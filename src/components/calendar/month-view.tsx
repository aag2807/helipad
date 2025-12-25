"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { es, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

interface MonthViewProps {
  currentDate: Date;
  bookings: Booking[];
  currentUserId: string;
  onDayClick: (date: Date) => void;
  onBookingClick: (booking: Booking) => void;
}

export function MonthView({
  currentDate,
  bookings,
  currentUserId,
  onDayClick,
  onBookingClick,
}: MonthViewProps) {
  const { t, locale } = useTranslations();
  const dateLocale = locale === "es" ? es : enUS;

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getBookingsForDay = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return booking.status === "confirmed" && isSameDay(bookingDate, date);
    });
  };

  const weekDays = [
    t("weekDays.short.mon"),
    t("weekDays.short.tue"),
    t("weekDays.short.wed"),
    t("weekDays.short.thu"),
    t("weekDays.short.fri"),
    t("weekDays.short.sat"),
    t("weekDays.short.sun"),
  ];

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-xs font-semibold text-zinc-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-zinc-100 transition-colors cursor-pointer hover:bg-zinc-50",
                !isCurrentMonth && "bg-zinc-50/50",
                index % 7 === 6 && "border-r-0",
                index >= days.length - 7 && "border-b-0"
              )}
              onClick={() => onDayClick(day)}
            >
              {/* Day number */}
              <div
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1",
                  isToday(day)
                    ? "bg-violet-600 text-white"
                    : isCurrentMonth
                    ? "text-zinc-900"
                    : "text-zinc-400"
                )}
              >
                {format(day, "d")}
              </div>

              {/* Bookings */}
              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((booking) => (
                  <button
                    key={booking.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick(booking);
                    }}
                    className={cn(
                      "w-full text-left text-xs px-2 py-1 rounded truncate transition-all hover:ring-1",
                      booking.userId === currentUserId
                        ? "bg-violet-100 text-violet-800 hover:ring-violet-300"
                        : "bg-zinc-100 text-zinc-700 hover:ring-zinc-300"
                    )}
                  >
                    {format(new Date(booking.startTime), "h:mm a", { locale: dateLocale })}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-zinc-500 pl-2">
                    +{dayBookings.length - 3} {t("calendar.more")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

