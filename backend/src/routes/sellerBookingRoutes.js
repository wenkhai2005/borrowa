const express = require("express");
const {
  acceptSellerBooking,
  completeSellerBooking,
  declineSellerBooking,
  getSellerBookingDetail,
  listPendingSellerBookings,
  listSellerBookings
} = require("../controllers/sellerBookingController");
const {
  approveSellerRefundRequest,
  listSellerRefundRequests,
  rejectSellerRefundRequest
} = require("../controllers/sellerRefundController");
const {
  createUnavailableDate,
  deleteUnavailableDate,
  listUnavailableDates
} = require("../controllers/sellerAvailabilityController");
const {
  createDamageReport,
  listSellerDamageReports
} = require("../controllers/damageReportController");
const {
  getSellerEarnings,
  markPayoutPaid
} = require("../controllers/sellerEarningsController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/bookings", listSellerBookings);
router.get("/bookings/pending", listPendingSellerBookings);
router.get("/bookings/:id", getSellerBookingDetail);
router.patch("/bookings/:id/accept", acceptSellerBooking);
router.patch("/bookings/:id/decline", declineSellerBooking);
router.patch("/bookings/:id/complete", completeSellerBooking);
router.post("/bookings/:id/damage-report", createDamageReport);
router.get("/refund-requests", listSellerRefundRequests);
router.patch("/refund-requests/:id/approve", approveSellerRefundRequest);
router.patch("/refund-requests/:id/reject", rejectSellerRefundRequest);
router.get("/listings/:id/unavailable-dates", listUnavailableDates);
router.post("/listings/:id/unavailable-dates", createUnavailableDate);
router.delete("/unavailable-dates/:id", deleteUnavailableDate);
router.get("/damage-reports", listSellerDamageReports);
router.get("/earnings", getSellerEarnings);
router.patch("/earnings/:bookingId/mark-paid", markPayoutPaid);

module.exports = router;
