const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const {
  findOverlappingActiveBooking,
  findOverlappingUnavailableDate,
  parseDateRange
} = require("../utils/availability");
const HttpError = require("../utils/httpError");

function requireSeller(req) {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }
}

async function getOwnedListingOrThrow(id, ownerEmail) {
  const listing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }

  if (listing.ownerEmail !== ownerEmail) {
    throw new HttpError(403, "Only the listing owner can manage availability.");
  }

  return listing;
}

const listUnavailableDates = asyncHandler(async (req, res) => {
  requireSeller(req);
  await getOwnedListingOrThrow(req.params.id, req.user.email);

  const unavailableDates = await prisma.listingUnavailableDate.findMany({
    where: { listingId: req.params.id },
    orderBy: { startDate: "asc" }
  });

  res.json({ data: unavailableDates });
});

const createUnavailableDate = asyncHandler(async (req, res) => {
  requireSeller(req);
  await getOwnedListingOrThrow(req.params.id, req.user.email);

  const { startDate, endDate } = parseDateRange(req.body);
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

  const overlappingBooking = await findOverlappingActiveBooking(prisma, {
    listingId: req.params.id,
    startDate,
    endDate
  });

  if (overlappingBooking) {
    throw new HttpError(400, "Cannot block dates that overlap pending or confirmed bookings.");
  }

  const overlappingUnavailableDate = await findOverlappingUnavailableDate(prisma, {
    listingId: req.params.id,
    startDate,
    endDate
  });

  if (overlappingUnavailableDate) {
    throw new HttpError(400, "Cannot block dates that overlap existing unavailable dates.");
  }

  const unavailableDate = await prisma.listingUnavailableDate.create({
    data: {
      listingId: req.params.id,
      startDate,
      endDate,
      reason: reason || null,
      type: "SELLER_BLOCKED"
    }
  });

  res.status(201).json({ data: unavailableDate });
});

const deleteUnavailableDate = asyncHandler(async (req, res) => {
  requireSeller(req);

  const unavailableDate = await prisma.listingUnavailableDate.findUnique({
    where: { id: req.params.id },
    include: { listing: true }
  });

  if (!unavailableDate) {
    throw new HttpError(404, "Unavailable date not found");
  }

  if (unavailableDate.listing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the listing owner can delete unavailable dates.");
  }

  if (unavailableDate.type !== "SELLER_BLOCKED") {
    throw new HttpError(400, "Booking unavailable dates cannot be deleted manually.");
  }

  await prisma.listingUnavailableDate.delete({
    where: { id: unavailableDate.id }
  });

  res.status(204).send();
});

module.exports = {
  createUnavailableDate,
  deleteUnavailableDate,
  listUnavailableDates
};
