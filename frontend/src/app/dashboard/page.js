"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DayGrid from "@/components/DayGrid";
import { apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";

const WeeklyGraph = ({ weekly = [] }) => {
  const max = Math.max(...weekly.map((w) => w.totalHours), 1);

  return (
    <section className="panel p-5 space-y-3">
      <h2 className="text-xl font-semibold">Weekly Consistency Graph</h2>
      <div className="space-y-2">
        {weekly.slice(0, 25).map((week) => {
          const width = Math.max(5, Math.round((week.totalHours / max) * 100));
          return (
            <div key={week.week} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Week {week.week}</span>
                <span>{week.totalHours}h | {week.lockedDays}/7 done</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-red-400"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default function DashboardPage() {
  const [days, setDays] = useState([]);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const activeDayNumber = useMemo(() => summary?.activeDayNumber || 1, [summary]);

  const loadData = async () => {
    try {
      const [dashboardData, analyticsData] = await Promise.all([
        apiRequest("/tracker/dashboard"),
        apiRequest("/tracker/analytics"),
      ]);
      setDays(dashboardData.days || []);
      setSummary(dashboardData.summary || null);
      setAnalytics(analyticsData.analytics || null);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      if (err.status === 401) {
        clearAuthToken();
        router.push("/login");
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
    loadData();
  }, []);

  const logout = () => {
    clearAuthToken();
    router.push("/login");
  };

  if (loading) return <main className="app-shell">Loading challenge dashboard...</main>;

  return (
    <main className="app-shell space-y-5">
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAANG 175-Day War Room</h1>
          <p className="text-slate-300 text-sm">Open day: Day {activeDayNumber} | Total challenge: 175 days</p>
        </div>
        <button onClick={logout} className="btn btn-muted">Logout</button>
      </header>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="panel p-4"><p className="text-sm text-slate-300">Completed</p><p className="text-2xl font-bold">{summary?.completedDays || 0}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Remaining</p><p className="text-2xl font-bold">{summary?.remainingDays || 175}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Total Hours</p><p className="text-2xl font-bold">{summary?.totalHours || 0}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Progress</p><p className="text-2xl font-bold">{summary?.progressPercent || 0}%</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Open Day</p><p className="text-2xl font-bold">{activeDayNumber || "-"}</p></div>
      </section>

      <section className="panel p-5 space-y-3">
        <h2 className="text-xl font-semibold">Daily Slot Blueprint</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
            <p className="text-sm font-semibold">Slot 1: DSA Deep Work</p>
            <p className="text-xs text-slate-300 mt-2">Start between 7:00 - 8:00 AM, 2.5h deep work, finish before 10:20 AM.</p>
          </div>
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4">
            <p className="text-sm font-semibold">Slot 2: System Design</p>
            <p className="text-xs text-slate-300 mt-2">2h architecture + notes + revision (with Gen AI days per weekly cycle).</p>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold">Slot 3: Evening Execution</p>
            <p className="text-xs text-slate-300 mt-2">6:00 PM onward, 2.5h college exam prep or backend/JS/React revision.</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">Rule: Open a day, complete checklist, Save & Lock. That day turns red. Next day opens automatically.</p>
      </section>

      <section className="panel p-5 space-y-3">
        <h2 className="text-xl font-semibold">175-Day Grid</h2>
        <DayGrid days={days} currentDayNumber={activeDayNumber} />
      </section>

      <WeeklyGraph weekly={analytics?.weekly || []} />
    </main>
  );
}
