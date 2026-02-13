const TRACKER_TOTAL_DAYS = 180;

const startDateAtUtcMidnight = () => {
  const raw = process.env.TRACKER_START_DATE || "2026-02-14";
  const start = new Date(`${raw}T00:00:00.000Z`);
  return start;
};

const getCurrentDayNumber = () => {
  const start = startDateAtUtcMidnight();
  const now = new Date();

  const nowUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startUtcMidnight = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );

  const diffDays = Math.floor((nowUtcMidnight - startUtcMidnight) / 86400000);
  const dayNumber = diffDays + 1;

  if (dayNumber < 1) return 1;
  if (dayNumber > TRACKER_TOTAL_DAYS) return TRACKER_TOTAL_DAYS;
  return dayNumber;
};

module.exports = {
  TRACKER_TOTAL_DAYS,
  startDateAtUtcMidnight,
  getCurrentDayNumber,
};
