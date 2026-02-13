"use client";

const rows = [
  { key: "dsa", label: "DSA" },
  { key: "backend", label: "Backend" },
  { key: "college", label: "College" },
  { key: "english", label: "English" },
  { key: "blockchain", label: "Blockchain" },
];

export default function CategoryHoursSection({ categoryHours = {} }) {
  const formatHours = (value) => Number(value || 0).toFixed(2);
  const formatMinutes = (value) => Math.round((Number(value || 0) * 60));

  return (
    <section className="panel p-5 space-y-3">
      <h2 className="text-xl font-semibold">Subject Study Time</h2>
      <p className="text-xs text-slate-400">
        Persistent lifetime hours tracked from timer per subject.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {rows.map((item) => (
          <div key={item.key} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{formatHours(categoryHours[item.key])}h</p>
            <p className="text-[11px] text-slate-500 mt-1">{formatMinutes(categoryHours[item.key])} min</p>
          </div>
        ))}
      </div>
    </section>
  );
}
