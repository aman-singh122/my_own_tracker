const express = require("express");
const { body } = require("express-validator");
const { signup, login, logout, me } = require("../controllers/authController");
const handleValidation = require("../middleware/validateMiddleware");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().isLength({ min: 2, max: 60 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  handleValidation,
  signup
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 6 })],
  handleValidation,
  login
);

router.post("/logout", protect, logout);
router.get("/me", protect, me);

module.exports = router;
