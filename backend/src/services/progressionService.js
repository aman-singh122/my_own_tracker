const DayRecord = require("../models/DayRecord");

const getProgressState = async (userId) => {
  const records = await DayRecord.find({ user: userId })
    .select("dayNumber completed")
    .sort({ dayNumber: 1 });

  const firstIncomplete = records.find((item) => !item.completed);

  if (!firstIncomplete) {
    return {
      activeDayNumber: null,
      allCompleted: true,
    };
  }

  return {
    activeDayNumber: firstIncomplete.dayNumber,
    allCompleted: false,
  };
};

module.exports = {
  getProgressState,
};
