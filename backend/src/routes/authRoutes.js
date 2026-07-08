const express = require("express");
const {
  login,
  me,
  register,
  resendVerification,
  verifyEmail
} = require("../controllers/authController");
const createRateLimit = require("../middleware/rateLimit");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes."
});
const resendVerificationRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many verification email requests. Please try again in 15 minutes."
});

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", requireAuth, resendVerificationRateLimit, resendVerification);
router.get("/me", requireAuth, me);

module.exports = router;
