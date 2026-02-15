const DayRecord = require("../models/DayRecord");
const { TRACKER_TOTAL_DAYS, startDateAtUtcMidnight } = require("../utils/trackerDate");
const { STUDY_CATEGORIES, buildCategorySecondsObject } = require("../utils/studyCategories");
const { getProgressState } = require("../services/progressionService");

const formatDayRecord = (record) => {
  const timerHours = record.timerSecondsLogged / 3600;
  const manualHours = record.manualHoursLogged || 0;
  const totalHours = Number((timerHours + record.manualHoursLogged).toFixed(2));
  const categorySeconds = record.categorySecondsLogged || buildCategorySecondsObject();
  const categoryHours = STUDY_CATEGORIES.reduce((acc, key) => {
    acc[key] = Number(((categorySeconds[key] || 0) / 3600).toFixed(2));
    return acc;
  }, {});
  return {
    ...record.toObject(),
    timerHours: Number(timerHours.toFixed(2)),
    manualHours: Number(manualHours.toFixed(2)),
    totalHours,
    categoryHours,
  };
};

const getDashboard = async (req, res, next) => {
  try {
    const records = await DayRecord.find({ user: req.user._id }).sort({ dayNumber: 1 });
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber || TRACKER_TOTAL_DAYS;

    const categorySecondsTotals = buildCategorySecondsObject();
    const totals = records.reduce(
      (acc, record) => {
        const timerHours = record.timerSecondsLogged / 3600;
        const totalHours = record.manualHoursLogged + record.timerSecondsLogged / 3600;
        if (record.completed) acc.completedDays += 1;
        acc.totalHours += totalHours;
        acc.timerHours += timerHours;
        acc.manualHours += record.manualHoursLogged;
        const categorySeconds = record.categorySecondsLogged || buildCategorySecondsObject();
        STUDY_CATEGORIES.forEach((key) => {
          categorySecondsTotals[key] += categorySeconds[key] || 0;
        });
        return acc;
      },
      { completedDays: 0, totalHours: 0, timerHours: 0, manualHours: 0 }
    );

    const progressPercent = Number(((totals.completedDays / TRACKER_TOTAL_DAYS) * 100).toFixed(2));

    res.status(200).json({
      days: records.map(formatDayRecord),
      summary: {
        completedDays: totals.completedDays,
        remainingDays: TRACKER_TOTAL_DAYS - totals.completedDays,
        totalHours: Number(totals.totalHours.toFixed(2)),
        timerHours: Number(totals.timerHours.toFixed(2)),
        manualHours: Number(totals.manualHours.toFixed(2)),
        progressPercent,
        currentDayNumber: activeDayNumber,
        activeDayNumber,
        allCompleted: progressState.allCompleted,
        trackerStartDate: startDateAtUtcMidnight(),
        categoryHours: STUDY_CATEGORIES.reduce((acc, key) => {
          acc[key] = Number((categorySecondsTotals[key] / 3600).toFixed(2));
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTrackerAnalytics = async (req, res, next) => {
  try {
    const records = await DayRecord.find({ user: req.user._id }).sort({ dayNumber: 1 });
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber || TRACKER_TOTAL_DAYS;

    const weekBuckets = Array.from({ length: Math.ceil(TRACKER_TOTAL_DAYS / 7) }, (_, index) => ({
      week: index + 1,
      hours: 0,
      completedDays: 0,
    }));

    const categoryDaysCount = {
      dsa: 0,
      backend: 0,
      college: 0,
      english: 0,
      blockchain: 0,
    };
    const categorySeconds = buildCategorySecondsObject();

    records.forEach((record) => {
      const weekIndex = Math.floor((record.dayNumber - 1) / 7);
      const dayHours = record.manualHoursLogged + record.timerSecondsLogged / 3600;
      weekBuckets[weekIndex].hours += dayHours;
      if (record.completed) weekBuckets[weekIndex].completedDays += 1;

      Object.keys(categoryDaysCount).forEach((key) => {
        if (record.categories?.[key]) categoryDaysCount[key] += 1;
      });

      const dayCategorySeconds = record.categorySecondsLogged || buildCategorySecondsObject();
      STUDY_CATEGORIES.forEach((key) => {
        categorySeconds[key] += dayCategorySeconds[key] || 0;
      });
    });

    const focusedWeeks = weekBuckets.slice(0, Math.ceil(activeDayNumber / 7));

    res.status(200).json({
      analytics: {
        currentDayNumber: activeDayNumber,
        activeDayNumber,
        weekly: focusedWeeks.map((w) => ({
          week: w.week,
          hours: Number(w.hours.toFixed(2)),
          completedDays: w.completedDays,
        })),
        categoryDaysCount,
        categoryHours: STUDY_CATEGORIES.reduce((acc, key) => {
          acc[key] = Number((categorySeconds[key] / 3600).toFixed(2));
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDayByNumber = async (req, res, next) => {
  try {
    const dayNumber = Number(req.params.dayNumber);
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber;

    const record = await DayRecord.findOne({ user: req.user._id, dayNumber });

    if (!record) {
      return res.status(404).json({ message: "Day record not found" });
    }

    if (!activeDayNumber) {
      return res.status(403).json({
        message: "All 180 days are completed.",
      });
    }

    if (dayNumber !== activeDayNumber) {
      const modeMessage = dayNumber < activeDayNumber
        ? "This day is already completed and locked."
        : "This day is locked. Complete previous day first.";
      return res.status(403).json({
        message: `${modeMessage} Current open day is Day ${activeDayNumber}.`,
      });
    }

    res.status(200).json({
      day: formatDayRecord(record),
      access: {
        mode: "editable",
        currentDayNumber: activeDayNumber,
        activeDayNumber,
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

    if (!activeDayNumber || dayNumber !== activeDayNumber) {
      const reason = dayNumber < (activeDayNumber || TRACKER_TOTAL_DAYS)
        ? "This day is already completed and locked"
        : "This day is locked";
      return res.status(403).json({
        message: `${reason}. Only Day ${activeDayNumber} can be updated now.`,
      });
    }

    const record = await DayRecord.findOne({ user: req.user._id, dayNumber });

    if (!record) {
      return res.status(404).json({ message: "Day record not found" });
    }

    const {
      categories,
      notes,
      reflection,
      weeklyReflection,
      revisionMarked,
      manualHoursLogged,
      completed,
    } = req.body;

    if (categories) {
      record.categories = {
        ...record.categories,
        ...categories,
      };
    }

    if (typeof notes === "string") record.notes = notes;
    if (typeof reflection === "string") record.reflection = reflection;
    if (typeof weeklyReflection === "string") record.weeklyReflection = weeklyReflection;
    if (typeof revisionMarked === "boolean") record.revisionMarked = revisionMarked;
    if (typeof manualHoursLogged === "number") record.manualHoursLogged = manualHoursLogged;
    if (typeof completed === "boolean") record.completed = completed;

    // Saving active day finalizes it and unlocks next day.
    record.completed = true;

    await record.save();

    const nextProgressState = await getProgressState(req.user._id);

    res.status(200).json({
      message: "Day saved and locked successfully",
      day: formatDayRecord(record),
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
