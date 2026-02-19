"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";

const slotLabels = {
  morningDsa: "Slot 1 (7-10:20 AM): DSA Deep Work",
  afternoonSystemDesign: "Slot 2: System Design / Gen AI",
  eveningExecution: "Slot 3 (Evening): College or Backend Revision",
};

const defaultForm = {
  slots: {
    morningDsa: {
      checklist: {
        deepFocusCompleted: false,
        lectureOrRevisionDone: false,
        questionPracticeDone: false,
        finishedBefore1020: false,
      },
      notes: "",
      hoursSpent: 0,
    },
    afternoonSystemDesign: {
      checklist: {
        lectureDone: false,
        notesDone: false,
        revisionDone: false,
        genAiTopicDone: false,
      },
      notes: "",
      hoursSpent: 0,
    },
    eveningExecution: {
      checklist: {
        primaryWorkDone: false,
        backendRevisionDone: false,
        jsOrReactConceptDone: false,
        focusedSessionDone: false,
      },
      notes: "",
      hoursSpent: 0,
    },
  },
  discipline: {
    noCopyPaste: false,
    noReels: false,
    noFap: false,
  },
  notes: "",
  reflection: "",
  weeklyReflection: "",
  revisionMarked: false,
};

const ChecklistFields = ({ checklist, onToggle, disabled }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {Object.entries(checklist).map(([key, value]) => (
      <label key={key} className="flex gap-2 items-center text-sm">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={() => onToggle(key)}
          disabled={disabled}
        />
        {key}
      </label>
    ))}
  </div>
);

export default function DayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dayNumber = Number(params.dayNumber);

  const [form, setForm] = useState(defaultForm);
  const [mode, setMode] = useState("locked");
  const [accessReason, setAccessReason] = useState("");
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditable = useMemo(() => mode === "editable", [mode]);
  const totalHours = useMemo(() => {
    const m = Number(form.slots.morningDsa.hoursSpent || 0);
    const a = Number(form.slots.afternoonSystemDesign.hoursSpent || 0);
    const e = Number(form.slots.eveningExecution.hoursSpent || 0);
    return Number((m + a + e).toFixed(2));
  }, [form]);

  const loadDay = async () => {
    try {
      const data = await apiRequest(`/tracker/days/${dayNumber}`);
      const day = data.day;
      setForm({
        slots: day.slots || defaultForm.slots,
        discipline: day.discipline || defaultForm.discipline,
        notes: day.notes || "",
        reflection: day.reflection || "",
        weeklyReflection: day.weeklyReflection || "",
        revisionMarked: Boolean(day.revisionMarked),
      });
      setMode(data.access?.mode || "locked");
      setAccessReason(data.access?.reason || "");
      setActiveDayNumber(data.access?.activeDayNumber || 1);
    } catch (err) {
      setError(err.message || "Failed to load day");
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
    if (!dayNumber || dayNumber < 1 || dayNumber > 175) {
      router.push("/dashboard");
      return;
    }
    loadDay();
  }, [dayNumber]);

  const toggleSlotChecklist = (slotKey, key) => {
    if (!isEditable) return;
    setForm((prev) => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotKey]: {
          ...prev.slots[slotKey],
          checklist: {
            ...prev.slots[slotKey].checklist,
            [key]: !prev.slots[slotKey].checklist[key],
          },
        },
      },
    }));
  };

  const updateSlotField = (slotKey, field, value) => {
    if (!isEditable) return;
    setForm((prev) => ({
      ...prev,
      slots: {
        ...prev.slots,
        [slotKey]: {
          ...prev.slots[slotKey],
          [field]: value,
        },
      },
    }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!isEditable) return;

    setSaving(true);
    setError("");
    try {
      await apiRequest(`/tracker/days/${dayNumber}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="app-shell">Loading day...</main>;

  return (
    <main className="app-shell space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Day {dayNumber}</h1>
          <p className="text-xs text-slate-400">
            {isEditable ? "Editable day. Save will lock it permanently." : accessReason || "Read-only day."}
          </p>
          <p className="text-xs text-slate-500 mt-1">Current open day: Day {activeDayNumber}</p>
        </div>
        <button className="btn btn-muted" onClick={() => router.push("/dashboard")}>Back</button>
      </header>

      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      <form className="panel p-5 space-y-5" onSubmit={onSave}>
        <div className="rounded-lg border border-slate-700 p-3 text-sm text-slate-300">
          Total logged for this day: <span className="font-semibold text-white">{totalHours}h</span>
        </div>

        {Object.keys(form.slots).map((slotKey) => (
          <section key={slotKey} className="rounded-xl border border-slate-700 bg-slate-900/55 p-4 space-y-3">
            <h2 className="font-semibold">{slotLabels[slotKey]}</h2>
            <ChecklistFields
              checklist={form.slots[slotKey].checklist}
              onToggle={(key) => toggleSlotChecklist(slotKey, key)}
              disabled={!isEditable}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Hours Spent</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="8"
                  step="0.25"
                  value={form.slots[slotKey].hoursSpent}
                  onChange={(e) => updateSlotField(slotKey, "hoursSpent", Number(e.target.value))}
                  disabled={!isEditable}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400">Slot Notes</label>
                <textarea
                  className="input min-h-20"
                  value={form.slots[slotKey].notes}
                  onChange={(e) => updateSlotField(slotKey, "notes", e.target.value)}
                  disabled={!isEditable}
                />
              </div>
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-slate-700 bg-slate-900/55 p-4 space-y-3">
          <h2 className="font-semibold">Discipline Rules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(form.discipline).map(([key, value]) => (
              <label key={key} className="flex gap-2 items-center text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={() =>
                    isEditable &&
                    setForm((prev) => ({
                      ...prev,
                      discipline: { ...prev.discipline, [key]: !prev.discipline[key] },
                    }))
                  }
                  disabled={!isEditable}
                />
                {key}
              </label>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Daily Notes</label>
            <textarea
              className="input min-h-24"
              value={form.notes}
              onChange={(e) => isEditable && setForm((prev) => ({ ...prev, notes: e.target.value }))}
              disabled={!isEditable}
            />
          </div>
          <div>
            <label className="text-sm">Reflection</label>
            <textarea
              className="input min-h-24"
              value={form.reflection}
              onChange={(e) => isEditable && setForm((prev) => ({ ...prev, reflection: e.target.value }))}
              disabled={!isEditable}
            />
          </div>
        </div>

        {isEditable ? (
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save & Lock Day"}
          </button>
        ) : null}
      </form>
    </main>
  );
}
