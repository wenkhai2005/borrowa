const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const {
  activeBookingStatuses,
  getAvailabilityConflict,
  parseDateRange
} = require("../utils/availability");
const HttpError = require("../utils/httpError");
const requireVerifiedEmail = require("../utils/requireVerifiedEmail");
const { validateListingPayload } = require("../validators/listingValidator");

async function addSellerRatingSummaries(listings) {
  const ownerEmails = [...new Set(listings.map((listing) => listing.ownerEmail).filter(Boolean))];

  if (ownerEmails.length === 0) {
    return listings;
  }

  const ratingGroups = await prisma.review.groupBy({
    by: ["revieweeEmail"],
    where: {
      revieweeEmail: { in: ownerEmails },
      reviewerRole: "RENTER"
    },
    _avg: { rating: true },
    _count: { rating: true }
  });

  const ratingByEmail = new Map(
    ratingGroups.map((group) => [
      group.revieweeEmail,
      {
        sellerAverageRating: group._avg.rating,
        sellerReviewCount: group._count.rating
      }
    ])
  );

  return listings.map((listing) => ({
    ...listing,
    sellerAverageRating: ratingByEmail.get(listing.ownerEmail)?.sellerAverageRating || null,
    sellerReviewCount: ratingByEmail.get(listing.ownerEmail)?.sellerReviewCount || 0
  }));
}

const listListings = asyncHandler(async (req, res) => {
  const where = { isAvailable: true };

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: await addSellerRatingSummaries(listings) });
});

const listMyListings = asyncHandler(async (req, res) => {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }

  const listings = await prisma.listing.findMany({
    where: { ownerEmail: req.user.email },
    orderBy: { createdAt: "desc" }
  });

  res.json({ data: await addSellerRatingSummaries(listings) });
});

const getListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id }
  });

  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }

  const [listingWithRating] = await addSellerRatingSummaries([listing]);

  res.json({ data: listingWithRating });
});

const getListingAvailability = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id }
  });

  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }

  const [unavailableDates, activeBookings] = await Promise.all([
    prisma.listingUnavailableDate.findMany({
      where: { listingId: req.params.id },
      select: {
        startDate: true,
        endDate: true,
        reason: true,
        type: true
      },
      orderBy: { startDate: "asc" }
    }),
    prisma.booking.findMany({
      where: {
        listingId: req.params.id,
        status: { in: activeBookingStatuses }
      },
      select: {
        startDate: true,
        endDate: true,
        status: true
      },
      orderBy: { startDate: "asc" }
    })
  ]);

  res.json({
    data: {
      unavailableDates,
      activeBookings
    }
  });
});

const checkListingAvailability = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id }
  });

  if (!listing) {
    throw new HttpError(404, "Listing not found");
  }

  if (!listing.isAvailable) {
    res.json({
      data: {
        available: false,
        reason: "Listing is not available for booking."
      }
    });
    return;
  }

  const { startDate, endDate } = parseDateRange(req.body);
  const conflict = await getAvailabilityConflict(prisma, {
    listingId: req.params.id,
    startDate,
    endDate
  });

  if (conflict) {
    res.json({
      data: {
        available: false,
        reason: conflict.reason
      }
    });
    return;
  }

  res.json({
    data: {
      available: true
    }
  });
});

const createListing = asyncHandler(async (req, res) => {
  const { ownerName, ownerEmail, ...payload } = req.body;
  const data = validateListingPayload(payload);

  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }
  requireVerifiedEmail(req.user);

  const listing = await prisma.listing.create({
    data: {
      ...data,
      ownerName: req.user.name,
      ownerEmail: req.user.email
    }
  });

  res.status(201).json({ data: listing });
});

const updateListing = asyncHandler(async (req, res) => {
  const { ownerName, ownerEmail, ...payload } = req.body;
  const data = validateListingPayload(payload, { partial: true });

  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }

  if (Object.keys(data).length === 0) {
    throw new HttpError(400, "At least one editable field is required.");
  }

  const existingListing = await prisma.listing.findUnique({
    where: { id: req.params.id }
  });

  if (!existingListing) {
    throw new HttpError(404, "Listing not found");
  }

  if (existingListing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the listing owner can update this listing.");
  }

  const listing = await prisma.listing.update({
    where: { id: req.params.id },
    data
  });

  res.json({ data: listing });
});

const deleteListing = asyncHandler(async (req, res) => {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }

  const existingListing = await prisma.listing.findUnique({
    where: { id: req.params.id }
  });

  if (!existingListing) {
    throw new HttpError(404, "Listing not found");
  }

  if (existingListing.ownerEmail !== req.user.email) {
    throw new HttpError(403, "Only the listing owner can delete this listing.");
  }

  await prisma.listing.delete({
    where: { id: req.params.id }
  });

  res.status(204).send();
});

module.exports = {
  checkListingAvailability,
  createListing,
  deleteListing,
  getListingAvailability,
  getListing,
  listMyListings,
  listListings,
  updateListing
};
