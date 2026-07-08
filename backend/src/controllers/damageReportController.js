const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const {
  sendDamageReportedEmailToRenter,
  sendDamageReportSubmittedEmailToSeller
} = require("../utils/email");

function requireSeller(req) {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }
}

function normalizeImageUrls(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateDamageReportPayload(payload) {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const imageUrls = normalizeImageUrls(payload.imageUrls);
  const errors = {};

  if (!title) {
    errors.title = "This field is required.";
  }

  if (!description) {
    errors.description = "This field is required.";
  }

  let claimAmount = null;
  if (payload.claimAmount !== undefined && payload.claimAmount !== null && payload.claimAmount !== "") {
    claimAmount = Number(payload.claimAmount);
    if (!Number.isFinite(claimAmount) || claimAmount < 0) {
      errors.claimAmount = "Must be a valid non-negative number.";
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  return {
    title,
    description,
    claimAmount,
    imageUrls
  };
}

const createDamageReport = asyncHandler(async (req, res) => {
  requireSeller(req);

  const data = validateDamageReportPayload(req.body);

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  if (booking.listing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the listing owner can report damage.");
  }

  if (!["CONFIRMED", "COMPLETED"].includes(booking.status)) {
    throw new HttpError(400, "Damage can only be reported for confirmed or completed bookings.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.damageReport.create({
      data: {
        bookingId: booking.id,
        sellerEmail: booking.listing.ownerEmail,
        renterEmail: booking.renterEmail,
        title: data.title,
        description: data.description,
        claimAmount: data.claimAmount,
        imageUrls: data.imageUrls
      },
      include: {
        booking: {
          include: { listing: true }
        }
      }
    });

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "DISPUTED",
        payoutStatus: "HOLD"
      },
      include: { listing: true }
    });

    return { report, booking: updatedBooking };
  });

  await Promise.all([
    sendDamageReportedEmailToRenter(result.report),
    sendDamageReportSubmittedEmailToSeller(result.report)
  ]);

  res.status(201).json({ data: result });
});

const listSellerDamageReports = asyncHandler(async (req, res) => {
  requireSeller(req);

  const reports = await prisma.damageReport.findMany({
    where: { sellerEmail: req.user.email },
    include: {
      booking: {
        include: { listing: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: reports });
});

const listMyDamageReports = asyncHandler(async (req, res) => {
  const reports = await prisma.damageReport.findMany({
    where: { renterEmail: req.user.email },
    include: {
      booking: {
        include: { listing: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: reports });
});

module.exports = {
  createDamageReport,
  listMyDamageReports,
  listSellerDamageReports
};
