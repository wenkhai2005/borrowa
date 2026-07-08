const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { removeBookingUnavailableDate } = require("../utils/availability");
const HttpError = require("../utils/httpError");
const {
  sendRefundApprovedEmailToRenter,
  sendRefundApprovedEmailToSeller,
  sendRefundRejectedEmailToRenter,
  sendRefundRejectedEmailToSeller
} = require("../utils/email");

function requireSeller(req) {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }
}

async function getSellerRefundBookingOrThrow(id, ownerEmail) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.listing.ownerEmail !== ownerEmail) {
    throw new HttpError(403, "Only the listing owner can manage this refund request.");
  }

  if (booking.refundStatus !== "REQUESTED") {
    throw new HttpError(400, "Only requested refunds can be reviewed.");
  }

  return booking;
}

const listSellerRefundRequests = asyncHandler(async (req, res) => {
  requireSeller(req);

  const bookings = await prisma.booking.findMany({
    where: {
      refundStatus: "REQUESTED",
      listing: {
        ownerEmail: req.user.email
      }
    },
    include: { listing: true },
    orderBy: { refundRequestedAt: "desc" }
  });

  res.json({ data: bookings });
});

const approveSellerRefundRequest = asyncHandler(async (req, res) => {
  requireSeller(req);

  const booking = await getSellerRefundBookingOrThrow(req.params.id, req.user.email);
  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";
  const now = new Date();

  console.log("[mock-refund]", {
    bookingId: booking.id,
    renterEmail: booking.renterEmail,
    amount: booking.totalPrice,
    reason: booking.refundReason
  });

  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.booking.update({
      where: { id: booking.id },
      data: {
        refundStatus: "APPROVED",
        refundRespondedAt: now,
        refundResponseNote: note || "Refund approved.",
        status: "CANCELLED",
        payoutStatus: "NOT_READY",
        payoutAt: null
      },
      include: { listing: true }
    });

    if (new Date() < booking.startDate) {
      await removeBookingUnavailableDate(tx, booking.id);
    }

    return approved;
  });

  await Promise.all([
    sendRefundApprovedEmailToRenter(updated),
    sendRefundApprovedEmailToSeller(updated)
  ]);

  res.json({ data: updated });
});

const rejectSellerRefundRequest = asyncHandler(async (req, res) => {
  requireSeller(req);

  const booking = await getSellerRefundBookingOrThrow(req.params.id, req.user.email);
  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";
  const now = new Date();

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      refundStatus: "REJECTED",
      refundRespondedAt: now,
      refundResponseNote: note || "Refund rejected."
    },
    include: { listing: true }
  });

  await Promise.all([
    sendRefundRejectedEmailToRenter(updated),
    sendRefundRejectedEmailToSeller(updated)
  ]);

  res.json({ data: updated });
});

module.exports = {
  approveSellerRefundRequest,
  listSellerRefundRequests,
  rejectSellerRefundRequest
};
