const DayRecord = require("../models/DayRecord");
const { TRACKER_TOTAL_DAYS, startDateAtUtcMidnight } = require("../utils/trackerDate");
const { ensureTrackerDaysForUser } = require("../services/trackerService");
const { getProgressState } = require("../services/progressionService");

const weekdayPlan = (dateValue) => {
  const date = new Date(dateValue);
  const day = date.getUTCDay(); // 0=sun ... 6=sat

  if (day === 1 || day === 2) return "System Design lecture + notes";
  if (day === 3) return "Gen AI lecture + System Design revision";
  if (day === 4 || day === 5) return "System Design lecture + notes revision";
  if (day === 6) return "Gen AI lecture + notes";
  return "System Design lecture";
};

const sumSlotHours = (record) => {
  const morning = Number(record?.slots?.morningDsa?.hoursSpent || 0);
  const afternoon = Number(record?.slots?.afternoonSystemDesign?.hoursSpent || 0);
  const evening = Number(record?.slots?.eveningExecution?.hoursSpent || 0);
  return Number((morning + afternoon + evening).toFixed(2));
};

const formatDayRecord = (record, activeDayNumber) => {
  const totalHours = sumSlotHours(record);
  return {
    ...record.toObject(),
    totalHours,
    isActive: record.dayNumber === activeDayNumber && !record.locked,
    isLocked: Boolean(record.locked || record.completed),
    systemDesignPlan: weekdayPlan(record.date),
  };
};

const getDashboard = async (req, res, next) => {
  try {
    await ensureTrackerDaysForUser(req.user._id);
    const records = await DayRecord.find({ user: req.user._id })
      .sort({ dayNumber: 1 })
      .limit(TRACKER_TOTAL_DAYS);
    const progressState = await getProgressState(req.user._id);

    const totals = records.reduce(
      (acc, record) => {
        if (record.locked || record.completed) acc.completedDays += 1;
        acc.totalHours += sumSlotHours(record);
        return acc;
      },
      { completedDays: 0, totalHours: 0 }
    );

    const progressPercent = Number(((totals.completedDays / TRACKER_TOTAL_DAYS) * 100).toFixed(2));

    res.status(200).json({
      days: records.map((record) => formatDayRecord(record, progressState.activeDayNumber)),
      summary: {
        completedDays: totals.completedDays,
        remainingDays: TRACKER_TOTAL_DAYS - totals.completedDays,
        totalHours: Number(totals.totalHours.toFixed(2)),
        progressPercent,
        currentDayNumber: progressState.activeDayNumber,
        activeDayNumber: progressState.activeDayNumber,
        allCompleted: progressState.allCompleted,
        trackerStartDate: startDateAtUtcMidnight(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTrackerAnalytics = async (req, res, next) => {
  try {
    await ensureTrackerDaysForUser(req.user._id);
    const records = await DayRecord.find({ user: req.user._id })
      .sort({ dayNumber: 1 })
      .limit(TRACKER_TOTAL_DAYS);
    const progressState = await getProgressState(req.user._id);

    const weekBuckets = Array.from({ length: Math.ceil(TRACKER_TOTAL_DAYS / 7) }, (_, index) => ({
      week: index + 1,
      totalHours: 0,
      lockedDays: 0,
    }));

    records.forEach((record) => {
      const weekIndex = Math.floor((record.dayNumber - 1) / 7);
      weekBuckets[weekIndex].totalHours += sumSlotHours(record);
      if (record.locked || record.completed) weekBuckets[weekIndex].lockedDays += 1;
    });

    res.status(200).json({
      analytics: {
        activeDayNumber: progressState.activeDayNumber,
        weekly: weekBuckets.map((week) => ({
          week: week.week,
          totalHours: Number(week.totalHours.toFixed(2)),
          lockedDays: week.lockedDays,
        })),
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

    if (!record) {
      return res.status(404).json({ message: "Day record not found" });
    }

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

    if (!record) {
      return res.status(404).json({ message: "Day record not found" });
    }

    if (record.locked || record.completed) {
      return res.status(403).json({ message: "This day is already locked and cannot be edited." });
    }

    if (!activeDayNumber || dayNumber !== activeDayNumber) {
      return res.status(403).json({
        message: `Only Day ${activeDayNumber} is open right now. Complete days sequentially.`,
      });
    }

    const { slots, discipline, notes, reflection, weeklyReflection, revisionMarked } = req.body;

    if (slots) {
      record.slots = {
        ...record.slots,
        ...slots,
      };
    }
    if (discipline) {
      record.discipline = {
        ...record.discipline,
        ...discipline,
      };
    }
    if (typeof notes === "string") record.notes = notes;
    if (typeof reflection === "string") record.reflection = reflection;
    if (typeof weeklyReflection === "string") record.weeklyReflection = weeklyReflection;
    if (typeof revisionMarked === "boolean") record.revisionMarked = revisionMarked;

    // Save action finalizes the day.
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

module.exports = {
  getDashboard,
  getTrackerAnalytics,
  getDayByNumber,
  updateDayByNumber,
};
