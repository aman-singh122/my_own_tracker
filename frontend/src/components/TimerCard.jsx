"use client";

import { useMemo } from "react";

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function TimerCard({ timer, onStart, onPause, onStop, activeDayNumber }) {
  const label = useMemo(() => formatTime(timer.seconds || 0), [timer.seconds]);

  return (
    <section className="panel p-5 space-y-4">
      <h2 className="text-xl font-semibold">Live Study Timer</h2>
      <p className="text-sm text-slate-300">Current day: {timer.dayNumber || activeDayNumber}</p>
      <p className="text-4xl font-mono tracking-wider">{label}</p>
      <div className="flex gap-3">
        <button className="btn btn-primary" onClick={onStart}>Start</button>
        <button className="btn btn-muted" onClick={onPause}>Pause</button>
        <button className="btn bg-red-500 text-white" onClick={onStop}>Stop & Save</button>
      </div>
      <p className="text-xs text-slate-400">Timer state is stored on the server, so refresh/close will not lose running progress.</p>
    </section>
  );
}
