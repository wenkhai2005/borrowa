const express = require("express");
const {
  cancelBooking,
  createBooking,
  getBooking,
  listBookings,
  requestRefund
} = require("../controllers/bookingController");
const {
  createBookingMessage,
  listBookingMessages,
  markBookingMessagesRead
} = require("../controllers/chatController");
const {
  createBookingReview,
  listBookingReviews
} = require("../controllers/reviewController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, listBookings);
router.post("/", requireAuth, createBooking);
router.get("/:id/messages", requireAuth, listBookingMessages);
router.post("/:id/messages", requireAuth, createBookingMessage);
router.patch("/:id/messages/read", requireAuth, markBookingMessagesRead);
router.get("/:id/reviews", requireAuth, listBookingReviews);
router.post("/:id/reviews", requireAuth, createBookingReview);
router.get("/:id", requireAuth, getBooking);
router.patch("/:id/cancel", requireAuth, cancelBooking);
router.post("/:id/refund-request", requireAuth, requestRefund);

module.exports = router;
