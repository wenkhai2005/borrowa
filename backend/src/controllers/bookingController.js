const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const requireVerifiedEmail = require("../utils/requireVerifiedEmail");
const { calculateBookingDays } = require("../utils/date");
const {
  getAvailabilityConflict,
  removeBookingUnavailableDate
} = require("../utils/availability");
const {
  sendBookingRequestSubmittedEmailToRenter,
  sendNewBookingRequestEmailToSeller,
  sendRefundRequestEmailToSeller,
  sendRefundRequestSubmittedEmailToRenter
} = require("../utils/email");
const { validateBookingPayload } = require("../validators/bookingValidator");

function mapBookingWithChatSummary(booking, viewerEmail) {
  const latestMessage = booking.chatMessages?.[0] || null;
  const unreadMessageCount = booking._count?.chatMessages || 0;
  const { chatMessages, _count, ...bookingData } = booking;

  return {
    ...bookingData,
    chatSummary: {
      latestMessage: latestMessage
        ? {
            id: latestMessage.id,
            senderEmail: latestMessage.senderEmail,
            senderName: latestMessage.senderName,
            senderRole: latestMessage.senderRole,
            message: latestMessage.message,
            createdAt: latestMessage.createdAt,
            isMine: latestMessage.senderEmail === viewerEmail
          }
        : null,
      unreadMessageCount
    }
  };
}

const listBookings = asyncHandler(async (req, res) => {
  if (req.user.role !== "RENTER") {
    throw new HttpError(403, "Renter account required.");
  }

  const renterEmail = req.user.email;

  const bookings = await prisma.booking.findMany({
    where: { renterEmail },
    include: {
      listing: true,
      reviews: {
        orderBy: { createdAt: "desc" }
      },
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          chatMessages: {
            where: {
              senderEmail: { not: renterEmail || "__none__" },
              readAt: null
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: bookings.map((booking) => mapBookingWithChatSummary(booking, renterEmail)) });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.renterEmail !== req.user.email && booking.listing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the booking renter or listing owner can view this booking.");
  }

  res.json({ data: booking });
});

const createBooking = asyncHandler(async (req, res) => {
  if (req.user.role !== "RENTER") {
    throw new HttpError(403, "Renter account required.");
  }
  requireVerifiedEmail(req.user);

  const data = validateBookingPayload({
    ...req.body,
    renterName: req.user.name,
    renterEmail: req.user.email
  });

  const booking = await prisma.$transaction(
    async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: data.listingId }
      });

      if (!listing) {
        throw new HttpError(404, "Listing not found");
      }

      if (!listing.isAvailable) {
        throw new HttpError(400, "Listing is not available for booking.");
      }

      const conflict = await getAvailabilityConflict(tx, {
        listingId: data.listingId,
        startDate: data.startDate,
        endDate: data.endDate
      });

      if (conflict) {
        throw new HttpError(400, conflict.reason);
      }

      const totalDays = calculateBookingDays(data.startDate, data.endDate);
      const totalPrice = Number(listing.dailyRate) * totalDays;
      const platformFee = totalPrice * 0.1;
      const sellerEarnings = totalPrice - platformFee;
      const paidAt = new Date();

      return tx.booking.create({
        data: {
          ...data,
          totalPrice,
          platformFee,
          sellerEarnings,
          payoutStatus: "NOT_READY",
          status: "PENDING",
          paidAt
        },
        include: { listing: true }
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );

  await Promise.all([
    sendNewBookingRequestEmailToSeller(booking),
    sendBookingRequestSubmittedEmailToRenter(booking)
  ]);

  res.status(201).json({ data: booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const existingBooking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true }
  });

  if (!existingBooking) {
    throw new HttpError(404, "Booking not found");
  }

  if (existingBooking.renterEmail !== req.user.email) {
    throw new HttpError(403, "Only the renter can cancel this booking.");
  }

  if (!["PENDING", "CONFIRMED"].includes(existingBooking.status)) {
    throw new HttpError(400, "Only pending or confirmed bookings can be cancelled.");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
      include: { listing: true }
    });

    if (new Date() < existingBooking.startDate) {
      await removeBookingUnavailableDate(tx, existingBooking.id);
    }

    return updated;
  });

  res.json({ data: booking });
});

const requestRefund = asyncHandler(async (req, res) => {
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

  if (!reason) {
    throw new HttpError(400, "Refund reason is required.");
  }

  const existingBooking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true }
  });

  if (!existingBooking) {
    throw new HttpError(404, "Booking not found");
  }

  if (existingBooking.renterEmail !== req.user.email) {
    throw new HttpError(403, "Only the renter can request a refund for this booking.");
  }

  if (!["CONFIRMED", "CANCELLED"].includes(existingBooking.status)) {
    throw new HttpError(400, "Refunds can only be requested for confirmed or cancelled bookings.");
  }

  if (["REQUESTED", "APPROVED"].includes(existingBooking.refundStatus)) {
    throw new HttpError(400, "A refund has already been requested or approved for this booking.");
  }

  const booking = await prisma.booking.update({
    where: { id: existingBooking.id },
    data: {
      refundStatus: "REQUESTED",
      refundRequestedAt: new Date(),
      refundReason: reason,
      refundResponseNote: null,
      refundRespondedAt: null
    },
    include: { listing: true }
  });

  await Promise.all([
    sendRefundRequestEmailToSeller(booking),
    sendRefundRequestSubmittedEmailToRenter(booking)
  ]);

  res.json({ data: booking });
});

module.exports = {
  cancelBooking,
  createBooking,
  getBooking,
  listBookings,
  requestRefund
};
