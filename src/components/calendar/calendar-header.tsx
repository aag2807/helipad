"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarView } from "@/hooks/use-calendar";
import { useTranslations } from "@/hooks/use-translations";

interface CalendarHeaderProps {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  title,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const { t } = useTranslations();

  const viewLabels: Record<CalendarView, string> = {
    day: t("calendar.day"),
    week: t("calendar.week"),
    month: t("calendar.month"),
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onToday} className="ml-2">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {t("calendar.today")}
        </Button>
        <h2 className="text-lg font-semibold text-zinc-900 ml-4">{title}</h2>
      </div>

      {/* View switcher */}
      <div className="flex items-center bg-zinc-100 rounded-xl p-1">
        {(["day", "week", "month"] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
              view === v
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            )}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  );
}

