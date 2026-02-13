"use client";

import Link from "next/link";

export default function DayGrid({ days, currentDayNumber }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2">
      {days.map((day) => {
        const isCurrent = day.dayNumber === currentDayNumber;
        const isPast = day.dayNumber < currentDayNumber;
        const isFuture = day.dayNumber > currentDayNumber;

        const commonClass = "text-xs text-center py-2 rounded-md border transition";

        if (isCurrent) {
          return (
            <Link
              href={`/days/${day.dayNumber}`}
              key={day._id}
              className={`${commonClass} bg-cyan-500/25 border-cyan-300/50 hover:bg-cyan-500/35`}
            >
              Day {day.dayNumber}
            </Link>
          );
        }

        if (isPast) {
          return (
            <div
              key={day._id}
              className={`${commonClass} ${
                day.completed
                  ? "bg-emerald-500/20 border-emerald-300/40 text-emerald-100"
                  : "bg-slate-700/20 border-slate-500/35 text-slate-300"
              }`}
              title="Past day (read-only)"
            >
              Day {day.dayNumber}
            </div>
          );
        }

        return (
          <div
            key={day._id}
            className={`${commonClass} bg-slate-900/70 border-slate-700/60 text-slate-500 cursor-not-allowed`}
            title="Future day locked"
          >
            Day {day.dayNumber} Lock
          </div>
        );
      })}
    </div>
  );
}
