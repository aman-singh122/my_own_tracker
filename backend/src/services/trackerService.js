const mongoose = require("mongoose");
const DayRecord = require("../models/DayRecord");
const { TRACKER_TOTAL_DAYS } = require("../utils/trackerDate");

const buildDateFromStart = (startDateString, offsetDays) => {
  const base = new Date(startDateString);
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base;
};

const createInitialTrackerForUser = async (userId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existing = await DayRecord.countDocuments({ user: userId }).session(session);
    if (existing > 0) {
      await session.commitTransaction();
      return;
    }

    const startDate = process.env.TRACKER_START_DATE || "2026-02-14";

    const records = Array.from({ length: TRACKER_TOTAL_DAYS }, (_, index) => ({
      user: userId,
      dayNumber: index + 1,
      date: buildDateFromStart(startDate, index),
    }));

    await DayRecord.insertMany(records, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const ensureTrackerDaysForUser = async (userId) => {
  const startDate = process.env.TRACKER_START_DATE || "2026-02-14";
  const existingRecords = await DayRecord.find({ user: userId }).select("dayNumber");
  const existingNumbers = new Set(existingRecords.map((r) => r.dayNumber));
  const missing = [];

  for (let i = 1; i <= TRACKER_TOTAL_DAYS; i += 1) {
    if (!existingNumbers.has(i)) {
      missing.push({
        user: userId,
        dayNumber: i,
        date: buildDateFromStart(startDate, i - 1),
      });
    }
  }

  if (missing.length > 0) {
    await DayRecord.insertMany(missing);
  }
};

module.exports = {
  createInitialTrackerForUser,
  ensureTrackerDaysForUser,
};
