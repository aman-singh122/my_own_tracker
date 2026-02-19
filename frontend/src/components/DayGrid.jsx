"use client";

import Link from "next/link";

export default function DayGrid({ days, currentDayNumber }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2">
      {days.map((day) => {
        const isCurrent = day.dayNumber === currentDayNumber && !day.completed;
        const isCompleted = day.completed;

        const commonClass = "text-xs text-center py-2 rounded-md border transition";

        let stateClass = "bg-slate-900/70 border-slate-700/60 text-slate-500";
        let label = `Day ${day.dayNumber}`;
        let title = "Locked day";

        if (isCurrent) {
          stateClass = "bg-cyan-500/25 border-cyan-300/50 hover:bg-cyan-500/35";
          title = "Open day";
        } else if (isCompleted) {
          stateClass = "bg-red-500/20 border-red-300/40 text-red-100 hover:bg-red-500/30";
          label = `Day ${day.dayNumber} Done`;
          title = "Completed day (read-only)";
        }

        return (
          <Link
            href={`/days/${day.dayNumber}`}
            key={day._id}
            className={`${commonClass} ${stateClass} ${!isCurrent && !isCompleted ? "opacity-80" : ""}`}
            title={title}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
