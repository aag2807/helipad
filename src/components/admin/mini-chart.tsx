"use client";

import { useMemo } from "react";
import { useTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: { date: string; bookings: number }[];
  height?: number;
}

export function MiniChart({ data, height = 120 }: MiniChartProps) {
  const { t } = useTranslations();
  
  const { max, points, labels } = useMemo(() => {
    const maxValue = Math.max(...data.map((d) => d.bookings), 1);
    const width = 100 / (data.length - 1);

    const points = data
      .map((d, i) => {
        const x = i * width;
        const y = 100 - (d.bookings / maxValue) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    // Get labels for every 7th day
    const labels = data
      .filter((_, i) => i % 7 === 0 || i === data.length - 1)
      .map((d, i, arr) => ({
        label: d.date,
        x: (data.indexOf(d) / (data.length - 1)) * 100,
      }));

    return { max: maxValue, points, labels };
  }, [data]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <h3 className="text-sm font-medium text-zinc-500 mb-4">
        {t("adminDashboard.bookingTrends")}
      </h3>

      <div style={{ height }} className="relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1="25"
            x2="100"
            y2="25"
            stroke="#e4e4e7"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke="#e4e4e7"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1="75"
            x2="100"
            y2="75"
            stroke="#e4e4e7"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Area fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-zinc-400 -ml-8 py-1">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-zinc-400">
        {labels.map((l, i) => (
          <span key={i}>{l.label}</span>
        ))}
      </div>
    </div>
  );
}

