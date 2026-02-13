const mongoose = require("mongoose");

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
      max: 180,
    },
    date: {
      type: Date,
      required: true,
    },
    categories: {
      dsa: { type: Boolean, default: false },
      backend: { type: Boolean, default: false },
      college: { type: Boolean, default: false },
      english: { type: Boolean, default: false },
      blockchain: { type: Boolean, default: false },
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
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

dayRecordSchema.index({ user: 1, dayNumber: 1 }, { unique: true });

module.exports = mongoose.model("DayRecord", dayRecordSchema);
