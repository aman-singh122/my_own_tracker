"use client";

const BarChart = ({ weekly }) => {
  const maxHours = Math.max(...weekly.map((w) => w.hours), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300">Weekly Hours</h3>
      <div className="space-y-2">
        {weekly.slice(-10).map((week) => {
          const width = Math.max(6, Math.round((week.hours / maxHours) * 100));
          return (
            <div key={week.week} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Week {week.week}</span>
                <span>{week.hours}h</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CategoryChart = ({ categories }) => {
  const entries = Object.entries(categories || {});
  const max = Math.max(...entries.map(([, value]) => value), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-300">Category Execution</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([name, value]) => (
          <div key={name} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="capitalize">{name}</span>
              <span>{value} days</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${Math.round((value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsPanel({ analytics }) {
  if (!analytics) {
    return <section className="panel p-4">Loading analytics...</section>;
  }

  return (
    <section className="panel p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p className="text-xs text-slate-400">Live through Day {analytics.currentDayNumber}</p>
      </div>
      <BarChart weekly={analytics.weekly || []} />
      <CategoryChart categories={analytics.categories || {}} />
    </section>
  );
}
