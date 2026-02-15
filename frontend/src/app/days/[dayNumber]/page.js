"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";

const categoryKeys = ["dsa", "backend", "college", "english", "blockchain"];

export default function DayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dayNumber = Number(params.dayNumber);

  const [form, setForm] = useState({
    categories: { dsa: false, backend: false, college: false, english: false, blockchain: false },
    notes: "",
    reflection: "",
    weeklyReflection: "",
    revisionMarked: false,
    manualHoursLogged: 0,
    completed: false,
  });
  const [totalHours, setTotalHours] = useState(0);
  const [timerHours, setTimerHours] = useState(0);
  const [manualHours, setManualHours] = useState(0);
  const [mode, setMode] = useState("locked");
  const [currentDayNumber, setCurrentDayNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditable = mode === "editable";

  const loadDay = async () => {
    try {
      const data = await apiRequest(`/tracker/days/${dayNumber}`);
      const day = data.day;
      setForm({
        categories: day.categories,
        notes: day.notes || "",
        reflection: day.reflection || "",
        weeklyReflection: day.weeklyReflection || "",
        revisionMarked: day.revisionMarked,
        manualHoursLogged: day.manualHoursLogged,
        completed: day.completed,
      });
      setTotalHours(day.totalHours || 0);
      setTimerHours(day.timerHours || 0);
      setManualHours(day.manualHours || 0);
      setMode(data.access?.mode || "locked");
      setCurrentDayNumber(data.access?.currentDayNumber || 1);
    } catch (err) {
      setError(err.message);
      if (err.status === 401) {
        clearAuthToken();
        router.push("/login");
      }
      if (err.status === 403) {
        setMode("locked");
        try {
          const dashboard = await apiRequest("/tracker/dashboard");
          setCurrentDayNumber(dashboard.summary?.currentDayNumber || 1);
        } catch (_innerErr) {
          setCurrentDayNumber(1);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      router.push("/login");
      return;
    }
    if (!dayNumber || dayNumber < 1 || dayNumber > 180) {
      router.push("/dashboard");
      return;
    }
    loadDay();
  }, [dayNumber]);

  const toggleCategory = (key) => {
    if (!isEditable) return;
    setForm((prev) => ({
      ...prev,
      categories: { ...prev.categories, [key]: !prev.categories[key] },
    }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!isEditable) return;

    setSaving(true);
    setError("");
    try {
      const data = await apiRequest(`/tracker/days/${dayNumber}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setTotalHours(data.day.totalHours || 0);
      setTimerHours(data.day.timerHours || 0);
      setManualHours(data.day.manualHours || 0);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="app-shell">Loading day...</main>;
  }

  if (!isEditable) {
    return (
      <main className="app-shell space-y-4">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Day {dayNumber}</h1>
          <button className="btn btn-muted" onClick={() => router.push("/dashboard")}>Back</button>
        </header>
        <section className="panel p-5">
          <p className="text-red-300">{error || "This day is locked."}</p>
          <p className="text-sm text-slate-300 mt-2">Current open day is Day {currentDayNumber}.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Day {dayNumber}</h1>
          <p className="text-xs text-slate-400">Current open day. Saving will lock this day and unlock next.</p>
        </div>
        <button className="btn btn-muted" onClick={() => router.push("/dashboard")}>Back</button>
      </header>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <form className="panel p-5 space-y-4" onSubmit={onSave}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <p className="text-sm text-slate-300">Timer Hours: {timerHours}</p>
          <p className="text-sm text-slate-300">Manual Hours: {manualHours}</p>
          <p className="text-sm text-slate-300">Total Hours: {totalHours}</p>
        </div>

        <div>
          <p className="font-semibold mb-2">Study Categories</p>
          <div className="flex flex-wrap gap-3">
            {categoryKeys.map((key) => (
              <label key={key} className="flex gap-2 items-center text-sm capitalize">
                <input
                  type="checkbox"
                  checked={form.categories[key]}
                  onChange={() => toggleCategory(key)}
                  disabled={!isEditable}
                />
                {key}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm">Manual Hours Logged</label>
          <input
            className="input"
            type="number"
            min="0"
            max="24"
            step="0.25"
            value={form.manualHoursLogged}
            onChange={(e) => setForm({ ...form, manualHoursLogged: Number(e.target.value) })}
            disabled={!isEditable}
          />
        </div>

        <div>
          <label className="text-sm">Notes</label>
          <textarea
            className="input min-h-24"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            disabled={!isEditable}
          />
        </div>

        <div>
          <label className="text-sm">Daily Reflection</label>
          <textarea
            className="input min-h-24"
            value={form.reflection}
            onChange={(e) => setForm({ ...form, reflection: e.target.value })}
            disabled={!isEditable}
          />
        </div>

        <div>
          <label className="text-sm">Weekly Reflection</label>
          <textarea
            className="input min-h-24"
            value={form.weeklyReflection}
            onChange={(e) => setForm({ ...form, weeklyReflection: e.target.value })}
            disabled={!isEditable}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.revisionMarked}
              onChange={(e) => setForm({ ...form, revisionMarked: e.target.checked })}
              disabled={!isEditable}
            />
            Revision Marked
          </label>
        </div>

        <button className="btn btn-primary" disabled={saving} type="submit">
          {saving ? "Saving..." : "Save & Lock Day"}
        </button>
      </form>
    </main>
  );
}
