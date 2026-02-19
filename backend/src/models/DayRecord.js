const mongoose = require("mongoose");
const { TRACKER_TOTAL_DAYS } = require("../utils/trackerDate");

const dayRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: TRACKER_TOTAL_DAYS,
    },
    date: {
      type: Date,
      required: true,
    },
    challengeType: {
      type: String,
      default: "faang-175-dsa",
    },
    slots: {
      morningDsa: {
        checklist: {
          deepFocusCompleted: { type: Boolean, default: false },
          lectureOrRevisionDone: { type: Boolean, default: false },
          questionPracticeDone: { type: Boolean, default: false },
          finishedBefore1020: { type: Boolean, default: false },
        },
        notes: { type: String, default: "", maxlength: 2000 },
        hoursSpent: { type: Number, default: 0, min: 0, max: 8 },
      },
      afternoonSystemDesign: {
        checklist: {
          lectureDone: { type: Boolean, default: false },
          notesDone: { type: Boolean, default: false },
          revisionDone: { type: Boolean, default: false },
          genAiTopicDone: { type: Boolean, default: false },
        },
        notes: { type: String, default: "", maxlength: 2000 },
        hoursSpent: { type: Number, default: 0, min: 0, max: 8 },
      },
      eveningExecution: {
        checklist: {
          primaryWorkDone: { type: Boolean, default: false },
          backendRevisionDone: { type: Boolean, default: false },
          jsOrReactConceptDone: { type: Boolean, default: false },
          focusedSessionDone: { type: Boolean, default: false },
        },
        notes: { type: String, default: "", maxlength: 2000 },
        hoursSpent: { type: Number, default: 0, min: 0, max: 8 },
      },
    },
    discipline: {
      noCopyPaste: { type: Boolean, default: false },
      noReels: { type: Boolean, default: false },
      noFap: { type: Boolean, default: false },
    },
    quality: {
      morningFocusScore: { type: Number, default: 0, min: 0, max: 5 },
      afternoonFocusScore: { type: Number, default: 0, min: 0, max: 5 },
      eveningFocusScore: { type: Number, default: 0, min: 0, max: 5 },
      energyScore: { type: Number, default: 0, min: 0, max: 5 },
    },
    interruptions: {
      morning: { type: Number, default: 0, min: 0, max: 50 },
      afternoon: { type: Number, default: 0, min: 0, max: 50 },
      evening: { type: Number, default: 0, min: 0, max: 50 },
    },
    notes: {
      type: String,
      default: "",
      maxlength: 3000,
    },
    reflection: {
      type: String,
      default: "",
      maxlength: 3000,
    },
    weeklyReflection: {
      type: String,
      default: "",
      maxlength: 3000,
    },
    revisionMarked: {
      type: Boolean,
      default: false,
    },
    manualHoursLogged: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    timerSecondsLogged: {
      type: Number,
      default: 0,
      min: 0,
    },
    categorySecondsLogged: {
      dsa: { type: Number, default: 0, min: 0 },
      backend: { type: Number, default: 0, min: 0 },
      college: { type: Number, default: 0, min: 0 },
      english: { type: Number, default: 0, min: 0 },
      blockchain: { type: Number, default: 0, min: 0 },
    },
    completed: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

dayRecordSchema.index({ user: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model("DayRecord", dayRecordSchema);
