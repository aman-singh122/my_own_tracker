"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DayGrid from "@/components/DayGrid";
import TimerCard from "@/components/TimerCard";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import CategoryHoursSection from "@/components/CategoryHoursSection";
import { apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";

const tabBase = "px-3 py-2 rounded-md text-sm border transition";

export default function DashboardPage() {
  const [days, setDays] = useState([]);
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timer, setTimer] = useState({ status: "idle", seconds: 0, dayNumber: 1, category: "dsa" });
  const [selectedCategory, setSelectedCategory] = useState("dsa");
  const [activeTab, setActiveTab] = useState("execution");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const currentDayNumber = useMemo(() => summary?.currentDayNumber || 1, [summary]);

  const loadData = async () => {
    try {
      const [dashboardData, timerData, analyticsData] = await Promise.all([
        apiRequest("/tracker/dashboard"),
        apiRequest("/timer/current"),
        apiRequest("/tracker/analytics"),
      ]);
      setDays(dashboardData.days || []);
      setSummary(dashboardData.summary);
      setAnalytics(analyticsData.analytics);
      const serverDay = dashboardData.summary?.currentDayNumber || 1;
      const timerPayload = timerData.timer || { status: "idle", seconds: 0, dayNumber: serverDay, category: "dsa" };
      setTimer(timerPayload);
      setSelectedCategory(timerPayload.category || "dsa");
    } catch (err) {
      setError(err.message);
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

  useEffect(() => {
    if (timer.status !== "running") return;

    const interval = setInterval(() => {
      setTimer((prev) => ({ ...prev, seconds: (prev.seconds || 0) + 1 }));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.status]);

  const startTimer = async () => {
    setError("");
    try {
      const data = await apiRequest("/timer/start", {
        method: "POST",
        body: JSON.stringify({ dayNumber: currentDayNumber, category: selectedCategory }),
      });
      setTimer(data.timer);
      setSelectedCategory(data.timer.category || selectedCategory);
    } catch (err) {
      setError(err.message);
    }
  };

  const pauseTimer = async () => {
    setError("");
    try {
      const data = await apiRequest("/timer/pause", { method: "POST" });
      setTimer(data.timer);
      setSelectedCategory(data.timer.category || selectedCategory);
    } catch (err) {
      setError(err.message);
    }
  };

  const stopTimer = async () => {
    setError("");
    try {
      await apiRequest("/timer/stop", { method: "POST" });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    clearAuthToken();
    router.push("/login");
  };

  if (loading) {
    return <main className="app-shell">Loading dashboard...</main>;
  }

  return (
    <main className="app-shell space-y-5">
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">180-Day Study Command Center</h1>
          <p className="text-slate-300 text-sm">Start date: February 14, 2026 | Active day: Day {currentDayNumber}</p>
        </div>
        <button onClick={logout} className="btn btn-muted">Logout</button>
      </header>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="panel p-4"><p className="text-sm text-slate-300">Completed Days</p><p className="text-2xl font-bold">{summary?.completedDays || 0}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Remaining Days</p><p className="text-2xl font-bold">{summary?.remainingDays || 180}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Total Hours</p><p className="text-2xl font-bold">{summary?.totalHours || 0}</p></div>
        <div className="panel p-4"><p className="text-sm text-slate-300">Progress</p><p className="text-2xl font-bold">{summary?.progressPercent || 0}%</p></div>
      </section>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab("execution")}
          className={`${tabBase} ${activeTab === "execution" ? "bg-cyan-500/20 border-cyan-300/50" : "bg-slate-800/60 border-slate-700"}`}
        >
          Execution
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`${tabBase} ${activeTab === "analytics" ? "bg-cyan-500/20 border-cyan-300/50" : "bg-slate-800/60 border-slate-700"}`}
        >
          Analytics
        </button>
      </div>

      {activeTab === "execution" ? (
        <>
          <TimerCard
            timer={timer}
            onStart={startTimer}
            onPause={pauseTimer}
            onStop={stopTimer}
            onCategoryChange={setSelectedCategory}
            selectedCategory={selectedCategory}
            activeDayNumber={currentDayNumber}
          />

          <CategoryHoursSection categoryHours={summary?.categoryHours || {}} />

          <section className="panel p-4 space-y-3">
            <h2 className="text-lg font-semibold">Days Grid</h2>
            <p className="text-xs text-slate-400">Only Day {currentDayNumber} is clickable today. Past days are read-only. Future days stay locked.</p>
            <DayGrid days={days} currentDayNumber={currentDayNumber} />
          </section>
        </>
      ) : (
        <AnalyticsPanel analytics={analytics} />
      )}
    </main>
  );
}
