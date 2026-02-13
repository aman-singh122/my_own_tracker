const express = require("express");
const { body } = require("express-validator");
const {
  startTimer,
  pauseTimer,
  stopTimer,
  getCurrentTimer,
} = require("../controllers/timerController");
const protect = require("../middleware/authMiddleware");
const handleValidation = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.get("/current", getCurrentTimer);

router.post(
  "/start",
  [body("dayNumber").isInt({ min: 1, max: 180 })],
  handleValidation,
  startTimer
);

router.post("/pause", pauseTimer);
router.post("/stop", stopTimer);

module.exports = router;
