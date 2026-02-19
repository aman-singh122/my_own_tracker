const DayRecord = require("../models/DayRecord");
const { TRACKER_TOTAL_DAYS, startDateAtUtcMidnight } = require("../utils/trackerDate");
const { ensureTrackerDaysForUser } = require("../services/trackerService");
const { getProgressState } = require("../services/progressionService");

const MORNING_TARGET = 2.5;
const AFTERNOON_TARGET = 2;
const EVENING_TARGET = 2.5;

const weekdayPlan = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getUTCDay();
  if (day === 1 || day === 2) return "System Design lecture + notes";
  if (day === 3) return "Gen AI lecture + System Design revision";
  if (day === 4 || day === 5) return "System Design lecture + revision";
  if (day === 6) return "Gen AI lecture + notes";
  return "System Design lecture";
};

const slotHours = (record) => ({
  morning: Number(record?.slots?.morningDsa?.hoursSpent || 0),
  afternoon: Number(record?.slots?.afternoonSystemDesign?.hoursSpent || 0),
  evening: Number(record?.slots?.eveningExecution?.hoursSpent || 0),
});

const sumSlotHours = (record) => {
  const h = slotHours(record);
  return Number((h.morning + h.afternoon + h.evening).toFixed(2));
};

const checklistCompletionPercent = (record) => {
  const checklists = [
    record?.slots?.morningDsa?.checklist || {},
    record?.slots?.afternoonSystemDesign?.checklist || {},
    record?.slots?.eveningExecution?.checklist || {},
  ];

  let total = 0;
  let done = 0;
  checklists.forEach((checklist) => {
    Object.values(checklist).forEach((v) => {
      total += 1;
      if (v) done += 1;
    });
  });
  if (!total) return 0;
  return Number(((done / total) * 100).toFixed(2));
};

const disciplineScore = (record) => {
  const values = Object.values(record?.discipline || {});
  if (!values.length) return 0;
  const done = values.filter(Boolean).length;
  return Number(((done / values.length) * 100).toFixed(2));
};

const isTargetMet = (record) => {
  const h = slotHours(record);
  return h.morning >= MORNING_TARGET && h.afternoon >= AFTERNOON_TARGET && h.evening >= EVENING_TARGET;
};

const focusScore = (record) => {
  const q = record?.quality || {};
  const values = [q.morningFocusScore || 0, q.afternoonFocusScore || 0, q.eveningFocusScore || 0, q.energyScore || 0];
  const sum = values.reduce((a, b) => a + b, 0);
  return Number((sum / values.length).toFixed(2));
};

const formatDayRecord = (record, activeDayNumber) => {
  const totalHours = sumSlotHours(record);
  return {
    ...record.toObject(),
    totalHours,
    checklistCompletionPercent: checklistCompletionPercent(record),
    disciplineScore: disciplineScore(record),
    focusScore: focusScore(record),
    isTargetMet: isTargetMet(record),
    isActive: record.dayNumber === activeDayNumber && !record.locked,
    isLocked: Boolean(record.locked || record.completed),
    systemDesignPlan: weekdayPlan(record.date),
  };
};

const computeStreaks = (records) => {
  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;

  records.forEach((record) => {
    if (record.locked || record.completed) {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  });

  for (let i = 0; i < records.length; i += 1) {
    if (records[i].locked || records[i].completed) currentStreak += 1;
    else break;
  }

  return { currentStreak, bestStreak };
};

const todayRisk = (activeRecord) => {
  if (!activeRecord) return false;
  const now = new Date();
  const hour = now.getHours();
  const morningStarted = Number(activeRecord?.slots?.morningDsa?.hoursSpent || 0) > 0;
  return hour >= 9 && !morningStarted;
};

const getDashboard = async (req, res, next) => {
  try {
    await ensureTrackerDaysForUser(req.user._id);
    const records = await DayRecord.find({ user: req.user._id }).sort({ dayNumber: 1 }).limit(TRACKER_TOTAL_DAYS);
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber;
    const activeRecord = records.find((d) => d.dayNumber === activeDayNumber);

    const totals = records.reduce(
      (acc, record) => {
        if (record.locked || record.completed) acc.completedDays += 1;
        acc.totalHours += sumSlotHours(record);
        acc.disciplineScore += disciplineScore(record);
        if (isTargetMet(record)) acc.targetMetDays += 1;
        return acc;
      },
      { completedDays: 0, totalHours: 0, disciplineScore: 0, targetMetDays: 0 }
    );

    const progressPercent = Number(((totals.completedDays / TRACKER_TOTAL_DAYS) * 100).toFixed(2));
    const streaks = computeStreaks(records);
    const avgDiscipline = records.length ? Number((totals.disciplineScore / records.length).toFixed(2)) : 0;

    res.status(200).json({
      days: records.map((record) => formatDayRecord(record, activeDayNumber)),
      summary: {
        completedDays: totals.completedDays,
        remainingDays: TRACKER_TOTAL_DAYS - totals.completedDays,
        totalHours: Number(totals.totalHours.toFixed(2)),
        progressPercent,
        currentDayNumber: activeDayNumber,
        activeDayNumber,
        allCompleted: progressState.allCompleted,
        trackerStartDate: startDateAtUtcMidnight(),
        currentStreak: streaks.currentStreak,
        bestStreak: streaks.bestStreak,
        averageDiscipline: avgDiscipline,
        targetMetDays: totals.targetMetDays,
        todayRisk: todayRisk(activeRecord),
        todayPlan: activeRecord
          ? {
              dayNumber: activeRecord.dayNumber,
              systemDesignPlan: weekdayPlan(activeRecord.date),
              morningTarget: MORNING_TARGET,
              afternoonTarget: AFTERNOON_TARGET,
              eveningTarget: EVENING_TARGET,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTrackerAnalytics = async (req, res, next) => {
  try {
    await ensureTrackerDaysForUser(req.user._id);
    const records = await DayRecord.find({ user: req.user._id }).sort({ dayNumber: 1 }).limit(TRACKER_TOTAL_DAYS);
    const progressState = await getProgressState(req.user._id);

    const weekBuckets = Array.from({ length: Math.ceil(TRACKER_TOTAL_DAYS / 7) }, (_, index) => ({
      week: index + 1,
      totalHours: 0,
      lockedDays: 0,
      avgFocus: 0,
      _focusSum: 0,
      _focusCount: 0,
    }));

    const heatmap = [];
    records.forEach((record) => {
      const weekIndex = Math.floor((record.dayNumber - 1) / 7);
      weekBuckets[weekIndex].totalHours += sumSlotHours(record);
      if (record.locked || record.completed) weekBuckets[weekIndex].lockedDays += 1;

      const f = focusScore(record);
      if (f > 0) {
        weekBuckets[weekIndex]._focusSum += f;
        weekBuckets[weekIndex]._focusCount += 1;
      }

      heatmap.push({
        dayNumber: record.dayNumber,
        intensity: Math.min(4, Math.floor(sumSlotHours(record))),
        locked: Boolean(record.locked || record.completed),
      });
    });

    const weekly = weekBuckets.map((week) => ({
      week: week.week,
      totalHours: Number(week.totalHours.toFixed(2)),
      lockedDays: week.lockedDays,
      avgFocus:
        week._focusCount > 0 ? Number((week._focusSum / week._focusCount).toFixed(2)) : 0,
    }));

    res.status(200).json({
      analytics: {
        activeDayNumber: progressState.activeDayNumber,
        weekly,
        heatmap,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDayByNumber = async (req, res, next) => {
  try {
    await ensureTrackerDaysForUser(req.user._id);
    const dayNumber = Number(req.params.dayNumber);
    const record = await DayRecord.findOne({ user: req.user._id, dayNumber });
    if (!record) return res.status(404).json({ message: "Day record not found" });

    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber;
    let mode = "locked";
    let reason = "This day is locked. Complete previous day first.";

    if (record.locked || record.completed) {
      mode = "readonly";
      reason = "This day is completed and locked.";
    } else if (activeDayNumber && dayNumber === activeDayNumber) {
      mode = "editable";
      reason = "Active day is open for editing.";
    }

    res.status(200).json({
      day: formatDayRecord(record, progressState.activeDayNumber),
      access: {
        mode,
        reason,
        currentDayNumber: progressState.activeDayNumber,
        activeDayNumber: progressState.activeDayNumber,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDayByNumber = async (req, res, next) => {
  try {
    const dayNumber = Number(req.params.dayNumber);
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber;
    const record = await DayRecord.findOne({ user: req.user._id, dayNumber });

    if (!record) return res.status(404).json({ message: "Day record not found" });
    if (record.locked || record.completed) {
      return res.status(403).json({ message: "This day is already locked and cannot be edited." });
    }
    if (!activeDayNumber || dayNumber !== activeDayNumber) {
      return res.status(403).json({ message: `Only Day ${activeDayNumber} is open right now.` });
    }

    const { slots, discipline, quality, interruptions, notes, reflection, weeklyReflection, revisionMarked } = req.body;
    if (slots) record.slots = { ...record.slots, ...slots };
    if (discipline) record.discipline = { ...record.discipline, ...discipline };
    if (quality) record.quality = { ...record.quality, ...quality };
    if (interruptions) record.interruptions = { ...record.interruptions, ...interruptions };
    if (typeof notes === "string") record.notes = notes;
    if (typeof reflection === "string") record.reflection = reflection;
    if (typeof weeklyReflection === "string") record.weeklyReflection = weeklyReflection;
    if (typeof revisionMarked === "boolean") record.revisionMarked = revisionMarked;

    record.completed = true;
    record.locked = true;
    record.lockedAt = new Date();
    await record.save();

    const nextProgressState = await getProgressState(req.user._id);
    res.status(200).json({
      message: "Day saved and locked successfully",
      day: formatDayRecord(record, nextProgressState.activeDayNumber),
      nextActiveDayNumber: nextProgressState.activeDayNumber,
    });
  } catch (error) {
    next(error);
  }
};

const exportTrackerData = async (req, res, next) => {
  try {
    await ensureTrackerDaysForUser(req.user._id);
    const records = await DayRecord.find({ user: req.user._id }).sort({ dayNumber: 1 }).limit(TRACKER_TOTAL_DAYS);
    const progressState = await getProgressState(req.user._id);

    res.status(200).json({
      exportedAt: new Date().toISOString(),
      userId: String(req.user._id),
      challenge: "faang-175-dsa",
      activeDayNumber: progressState.activeDayNumber,
      days: records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getTrackerAnalytics,
  getDayByNumber,
  updateDayByNumber,
  exportTrackerData,
};
