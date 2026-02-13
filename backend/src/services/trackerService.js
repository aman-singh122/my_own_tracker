const mongoose = require("mongoose");
const DayRecord = require("../models/DayRecord");

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

    const records = Array.from({ length: 180 }, (_, index) => ({
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

module.exports = {
  createInitialTrackerForUser,
};
