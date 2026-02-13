"use client";

import { useMemo } from "react";

const categoryList = [
  { key: "dsa", label: "DSA" },
  { key: "backend", label: "Backend" },
  { key: "college", label: "College" },
  { key: "english", label: "English" },
  { key: "blockchain", label: "Blockchain" },
];

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function TimerCard({
  timer,
  onStart,
  onPause,
  onStop,
  onCategoryChange,
  selectedCategory,
  activeDayNumber,
}) {
  const label = useMemo(() => formatTime(timer.seconds || 0), [timer.seconds]);
  const activeCategory = timer.category || selectedCategory || "dsa";
  const stateLabel = timer.status === "running" ? "Running" : timer.status === "paused" ? "Paused" : "Idle";

  return (
    <section className="panel p-5 space-y-4">
      <h2 className="text-xl font-semibold">Live Study Timer</h2>
      <p className="text-sm text-slate-300">Current day: {timer.dayNumber || activeDayNumber}</p>
      <p className="text-sm text-slate-300">
        Focus subject: <span className="text-cyan-300 font-semibold capitalize">{activeCategory}</span>
      </p>
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs">
        <span className={`h-2 w-2 rounded-full ${timer.status === "running" ? "bg-emerald-400" : timer.status === "paused" ? "bg-yellow-400" : "bg-slate-500"}`} />
        {stateLabel}
      </div>
      <div className="flex flex-wrap gap-2">
        {categoryList.map((item) => {
          const isActive = activeCategory === item.key;
          const lockCategorySwitch = timer.status !== "idle";
          return (
            <button
              key={item.key}
              type="button"
              disabled={lockCategorySwitch}
              onClick={() => onCategoryChange(item.key)}
              className={`btn category-chip ${isActive ? "category-chip-active" : ""} ${
                lockCategorySwitch ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="text-4xl font-mono tracking-wider">{label}</p>
      <div className="flex gap-3">
        <button
          className="btn btn-primary btn-interactive disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onStart}
          disabled={timer.status === "running"}
        >
          Start
        </button>
        <button
          className="btn btn-muted btn-interactive disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onPause}
          disabled={timer.status !== "running"}
        >
          Pause
        </button>
        <button
          className="btn btn-danger btn-interactive disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={onStop}
          disabled={timer.status === "idle" && (timer.seconds || 0) === 0}
        >
          Stop & Save
        </button>
      </div>
      <p className="text-xs text-slate-400">
        Timer state and subject time are stored on the server, so refresh/close will not lose progress.
      </p>
    </section>
  );
}
