const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

function requireSeller(req) {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }
}

function toNumber(value) {
  return Number(value || 0);
}

function summarizeBookings(bookings) {
  return bookings.reduce(
    (summary, booking) => {
      const sellerEarnings = toNumber(booking.sellerEarnings);
      const platformFee = toNumber(booking.platformFee);

      if (booking.status === "COMPLETED") {
        summary.totalCompletedEarnings += sellerEarnings;
        summary.completedBookingsCount += 1;
      }

      if (booking.status === "DISPUTED") {
        summary.disputedBookingsCount += 1;
      }

      if (booking.payoutStatus === "PENDING") {
        summary.pendingPayout += sellerEarnings;
      }

      if (booking.payoutStatus === "PAID") {
        summary.paidPayout += sellerEarnings;
      }

      if (booking.payoutStatus === "HOLD") {
        summary.onHoldAmount += sellerEarnings;
      }

      if (["COMPLETED", "DISPUTED"].includes(booking.status)) {
        summary.platformFees += platformFee;
      }

      return summary;
    },
    {
      totalCompletedEarnings: 0,
      pendingPayout: 0,
      paidPayout: 0,
      onHoldAmount: 0,
      platformFees: 0,
      completedBookingsCount: 0,
      disputedBookingsCount: 0
    }
  );
}

const getSellerEarnings = asyncHandler(async (req, res) => {
  requireSeller(req);

  const bookings = await prisma.booking.findMany({
    where: {
      listing: {
        ownerEmail: req.user.email
      }
    },
    include: { listing: true },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    data: {
      summary: summarizeBookings(bookings),
      bookings
    }
  });
});

const markPayoutPaid = asyncHandler(async (req, res) => {
  requireSeller(req);

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.bookingId },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.listing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the listing owner can update payout status.");
  }

  if (booking.status !== "COMPLETED") {
    throw new HttpError(400, "Only completed bookings can be marked as paid.");
  }

  if (booking.payoutStatus !== "PENDING") {
    throw new HttpError(400, "Only pending payouts can be marked as paid.");
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      payoutStatus: "PAID",
      payoutAt: new Date()
    },
    include: { listing: true }
  });

  res.json({ data: updated });
});

module.exports = {
  getSellerEarnings,
  markPayoutPaid
};
