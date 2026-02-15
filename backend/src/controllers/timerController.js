const DayRecord = require("../models/DayRecord");
const TimerSession = require("../models/TimerSession");
const { STUDY_CATEGORIES, buildCategorySecondsObject } = require("../utils/studyCategories");
const { getProgressState } = require("../services/progressionService");

const computeSeconds = (session) => {
  if (!session) return 0;
  if (session.status !== "running" || !session.startedAt) return session.accumulatedSeconds;
  const now = Date.now();
  const elapsed = Math.floor((now - new Date(session.startedAt).getTime()) / 1000);
  return session.accumulatedSeconds + Math.max(elapsed, 0);
};

const getOrCreateTimerSession = async (userId, dayNumber = 1) => {
  let session = await TimerSession.findOne({ user: userId });
  if (!session) {
    session = await TimerSession.create({
      user: userId,
      dayNumber,
      status: "idle",
      category: "dsa",
      accumulatedSeconds: 0,
      startedAt: null,
    });
  }

  if (!STUDY_CATEGORIES.includes(session.category)) {
    session.category = "dsa";
    await session.save();
  }

  return session;
};

const startTimer = async (req, res, next) => {
  try {
    const dayNumber = Number(req.body.dayNumber);
    const category = String(req.body.category || "").toLowerCase();
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber;

    if (!activeDayNumber) {
      return res.status(403).json({ message: "All 180 days are completed. Timer is locked." });
    }

    if (dayNumber !== activeDayNumber) {
      return res.status(403).json({
        message: `Timer can only start on active day. Open day is Day ${activeDayNumber}.`,
      });
    }

    if (!STUDY_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid study category" });
    }

    const day = await DayRecord.findOne({ user: req.user._id, dayNumber });
    if (!day) {
      return res.status(404).json({ message: "Invalid day number" });
    }

    const session = await getOrCreateTimerSession(req.user._id, dayNumber);

    if (session.status === "running") {
      return res.status(400).json({ message: "Timer is already running" });
    }

    session.dayNumber = dayNumber;
    session.category = category;
    session.status = "running";
    session.startedAt = new Date();
    await session.save();

    res.status(200).json({
      message: "Timer started",
      timer: {
        dayNumber: session.dayNumber,
        category: session.category,
        status: session.status,
        seconds: computeSeconds(session),
      },
    });
  } catch (error) {
    next(error);
  }
};

const pauseTimer = async (req, res, next) => {
  try {
    const session = await getOrCreateTimerSession(req.user._id);

    if (session.status !== "running") {
      return res.status(400).json({ message: "Timer is not running" });
    }

    const totalSeconds = computeSeconds(session);
    session.accumulatedSeconds = totalSeconds;
    session.status = "paused";
    session.startedAt = null;
    await session.save();

    res.status(200).json({
      message: "Timer paused",
      timer: {
        dayNumber: session.dayNumber,
        category: session.category,
        status: session.status,
        seconds: session.accumulatedSeconds,
      },
    });
  } catch (error) {
    next(error);
  }
};

const stopTimer = async (req, res, next) => {
  try {
    const session = await getOrCreateTimerSession(req.user._id);

    if (session.status === "idle" && session.accumulatedSeconds === 0) {
      return res.status(400).json({ message: "No active timer to stop" });
    }

    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber;
    if (!activeDayNumber) {
      return res.status(403).json({ message: "All 180 days are completed. Timer is locked." });
    }

    if (session.dayNumber !== activeDayNumber) {
      return res.status(403).json({
        message: `Timer save is locked for Day ${session.dayNumber}. Only Day ${activeDayNumber} can be modified.`,
      });
    }

    const totalSeconds = computeSeconds(session);
    const day = await DayRecord.findOne({ user: req.user._id, dayNumber: session.dayNumber });

    if (!day) {
      return res.status(404).json({ message: "Day record not found" });
    }

    if (!day.categorySecondsLogged) {
      day.categorySecondsLogged = buildCategorySecondsObject();
    }

    day.timerSecondsLogged += totalSeconds;
    day.categorySecondsLogged[session.category] =
      (day.categorySecondsLogged[session.category] || 0) + totalSeconds;
    await day.save();

    session.status = "idle";
    session.startedAt = null;
    session.accumulatedSeconds = 0;
    await session.save();

    res.status(200).json({
      message: "Timer stopped and saved",
      savedSeconds: totalSeconds,
      day: {
        dayNumber: day.dayNumber,
        timerSecondsLogged: day.timerSecondsLogged,
        category: session.category,
        categorySecondsLogged: day.categorySecondsLogged,
        totalHours: Number((day.manualHoursLogged + day.timerSecondsLogged / 3600).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentTimer = async (req, res, next) => {
  try {
    const progressState = await getProgressState(req.user._id);
    const activeDayNumber = progressState.activeDayNumber || 1;
    const session = await getOrCreateTimerSession(req.user._id, activeDayNumber);

    res.status(200).json({
      timer: {
        dayNumber: session.dayNumber,
        category: session.category,
        status: session.status,
        seconds: computeSeconds(session),
      },
      currentDayNumber: activeDayNumber,
      activeDayNumber,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startTimer,
  pauseTimer,
  stopTimer,
  getCurrentTimer,
};
