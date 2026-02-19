const express = require("express");
const { body, param } = require("express-validator");
const {
  getDashboard,
  getTrackerAnalytics,
  getDayByNumber,
  updateDayByNumber,
} = require("../controllers/trackerController");
const protect = require("../middleware/authMiddleware");
const handleValidation = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.get("/dashboard", getDashboard);
router.get("/analytics", getTrackerAnalytics);

router.get(
  "/days/:dayNumber",
  [param("dayNumber").isInt({ min: 1, max: 175 })],
  handleValidation,
  getDayByNumber
);

router.put(
  "/days/:dayNumber",
  [
    param("dayNumber").isInt({ min: 1, max: 175 }),
    body("notes").optional().isString().isLength({ max: 3000 }),
    body("reflection").optional().isString().isLength({ max: 3000 }),
    body("weeklyReflection").optional().isString().isLength({ max: 3000 }),
    body("revisionMarked").optional().isBoolean(),
    body("slots").optional().isObject(),
    body("discipline").optional().isObject(),
  ],
  handleValidation,
  updateDayByNumber
);

module.exports = router;
