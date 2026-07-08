const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const {
  findOverlappingUnavailableDate
} = require("../utils/availability");
const HttpError = require("../utils/httpError");
const {
  sendBookingAcceptedEmailToSeller,
  sendBookingCompletedEmailToRenter,
  sendBookingCompletedEmailToSeller,
  sendBookingConfirmedEmailToRenter,
  sendBookingDeclinedEmailToRenter,
  sendBookingDeclinedEmailToSeller
} = require("../utils/email");

function requireSellerOwner(req, ownerEmail) {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }

  if (req.user.email !== ownerEmail) {
    throw new HttpError(403, "Authenticated seller does not match ownerEmail.");
  }
}

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

async function getSellerBookingOrThrow(id, ownerEmail) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.listing.ownerEmail !== ownerEmail) {
    throw new HttpError(403, "Only the listing owner can manage this booking.");
  }

  return booking;
}

const listSellerBookings = asyncHandler(async (req, res) => {
  const ownerEmail = req.user.email;

  requireSellerOwner(req, ownerEmail);

  const bookings = await prisma.booking.findMany({
    where: {
      listing: { ownerEmail }
    },
    include: {
      listing: true,
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          chatMessages: {
            where: {
              senderEmail: { not: ownerEmail },
              readAt: null
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: bookings.map((booking) => mapBookingWithChatSummary(booking, ownerEmail)) });
});

const listPendingSellerBookings = asyncHandler(async (req, res) => {
  const ownerEmail = req.user.email;

  requireSellerOwner(req, ownerEmail);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      listing: { ownerEmail }
    },
    include: {
      listing: true,
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          chatMessages: {
            where: {
              senderEmail: { not: ownerEmail },
              readAt: null
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: bookings.map((booking) => mapBookingWithChatSummary(booking, ownerEmail)) });
});

const getSellerBookingDetail = asyncHandler(async (req, res) => {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      listing: true,
      reviews: {
        orderBy: { createdAt: "desc" }
      },
      damageReports: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.listing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the listing owner can view this booking.");
  }

  res.json({ data: booking });
});

const acceptSellerBooking = asyncHandler(async (req, res) => {
  const ownerEmail = req.user.email;

  requireSellerOwner(req, ownerEmail);

  const booking = await getSellerBookingOrThrow(req.params.id, ownerEmail);

  if (booking.status !== "PENDING") {
    throw new HttpError(400, "Only pending bookings can be accepted.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const overlappingConfirmedBooking = await tx.booking.findFirst({
      where: {
        id: { not: booking.id },
        listingId: booking.listingId,
        status: "CONFIRMED",
        startDate: { lte: booking.endDate },
        endDate: { gte: booking.startDate }
      }
    });

    if (overlappingConfirmedBooking) {
      throw new HttpError(409, "A confirmed booking already overlaps with these dates.");
    }

    const overlappingSellerBlockedDate = await findOverlappingUnavailableDate(tx, {
      listingId: booking.listingId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      type: "SELLER_BLOCKED"
    });

    if (overlappingSellerBlockedDate) {
      throw new HttpError(400, "Dates overlap with seller blocked unavailable dates.");
    }

    const acceptedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CONFIRMED",
        sellerAcceptedAt: new Date()
      },
      include: { listing: true }
    });

    const existingBookingBlock = await tx.listingUnavailableDate.findFirst({
      where: {
        bookingId: booking.id,
        type: "BOOKING"
      }
    });

    if (!existingBookingBlock) {
      await tx.listingUnavailableDate.create({
        data: {
          listingId: booking.listingId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          reason: "Confirmed booking",
          type: "BOOKING",
          bookingId: booking.id
        }
      });
    }

    return acceptedBooking;
  });

  await Promise.all([
    sendBookingConfirmedEmailToRenter(updated),
    sendBookingAcceptedEmailToSeller(updated)
  ]);

  res.json({ data: updated });
});

const declineSellerBooking = asyncHandler(async (req, res) => {
  const ownerEmail = req.user.email;

  requireSellerOwner(req, ownerEmail);

  const booking = await getSellerBookingOrThrow(req.params.id, ownerEmail);

  if (booking.status !== "PENDING") {
    throw new HttpError(400, "Only pending bookings can be declined.");
  }

  const now = new Date();
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      sellerDeclinedAt: now
    },
    include: { listing: true }
  });

  await Promise.all([
    sendBookingDeclinedEmailToRenter(updated),
    sendBookingDeclinedEmailToSeller(updated)
  ]);

  res.json({ data: updated });
});

const completeSellerBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  requireSellerOwner(req, booking.listing.ownerEmail);

  if (booking.status !== "CONFIRMED") {
    throw new HttpError(400, "Only confirmed bookings can be completed.");
  }

  if (booking.refundStatus === "REQUESTED") {
    throw new HttpError(400, "Resolve the refund request before completing this booking.");
  }

  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "COMPLETED",
      payoutStatus: "PENDING",
      completedAt: new Date(),
      completionNote: note || null
    },
    include: { listing: true }
  });

  await Promise.all([
    sendBookingCompletedEmailToRenter(updated),
    sendBookingCompletedEmailToSeller(updated)
  ]);

  res.json({ data: updated });
});

module.exports = {
  acceptSellerBooking,
  completeSellerBooking,
  declineSellerBooking,
  getSellerBookingDetail,
  listPendingSellerBookings,
  listSellerBookings
};
