const mongoose = require("mongoose");
const { STUDY_CATEGORIES } = require("../utils/studyCategories");

const timerSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 180,
    },
    status: {
      type: String,
      enum: ["idle", "running", "paused"],
      default: "idle",
    },
    category: {
      type: String,
      enum: STUDY_CATEGORIES,
      default: "dsa",
    },
    startedAt: {
      type: Date,
      default: null,
    },
    accumulatedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimerSession", timerSessionSchema);
