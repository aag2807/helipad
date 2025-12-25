import { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  isBefore,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";

export type CalendarView = "week" | "day" | "month";

export function useCalendar(initialView: CalendarView = "week") {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(initialView);

  const dateRange = useMemo(() => {
    switch (view) {
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
      case "week":
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
      case "month":
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  }, [currentDate, view]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    });
  }, [dateRange]);

  const goToNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const goToPrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToDate = (date: Date) => {
    setCurrentDate(date);
  };

  const getTitle = () => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        if (format(weekStart, "MMM") === format(weekEnd, "MMM")) {
          return `${format(weekStart, "MMM d")} - ${format(weekEnd, "d, yyyy")}`;
        }
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
      case "month":
        return format(currentDate, "MMMM yyyy");
    }
  };

  return {
    currentDate,
    view,
    setView,
    dateRange,
    days,
    goToNext,
    goToPrevious,
    goToToday,
    goToDate,
    getTitle,
    isSameDay,
    isToday,
    isBefore,
  };
}

// Time slot helpers
export function generateTimeSlots(
  startHour: number = 6,
  endHour: number = 22,
  intervalMinutes: number = 15
) {
  const slots: { hour: number; minute: number; label: string }[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      slots.push({
        hour,
        minute,
        label: format(time, "h:mm a"),
      });
    }
  }
  
  return slots;
}

export function getSlotDateTime(date: Date, hour: number, minute: number): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

