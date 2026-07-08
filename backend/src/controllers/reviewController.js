const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

function parseRating(value) {
  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, "Rating must be an integer from 1 to 5.");
  }

  return rating;
}

async function getBookingForReviewOrThrow(bookingId, userEmail) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      reviews: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  const isRenter = booking.renterEmail === userEmail;
  const isSeller = booking.listing.ownerEmail === userEmail;

  if (!isRenter && !isSeller) {
    throw new HttpError(403, "Only the booking renter or listing owner can access these reviews.");
  }

  return {
    booking,
    reviewerRole: isRenter ? "RENTER" : "SELLER",
    revieweeEmail: isRenter ? booking.listing.ownerEmail : booking.renterEmail
  };
}

const createBookingReview = asyncHandler(async (req, res) => {
  const rating = parseRating(req.body.rating);
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
  const { booking, reviewerRole, revieweeEmail } = await getBookingForReviewOrThrow(req.params.id, req.user.email);

  if (booking.status !== "COMPLETED") {
    throw new HttpError(400, "Only completed bookings can be reviewed.");
  }

  const existingReview = booking.reviews.find((review) => review.reviewerRole === reviewerRole);

  if (existingReview) {
    throw new HttpError(400, "You have already reviewed this booking.");
  }

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      reviewerEmail: req.user.email,
      revieweeEmail,
      reviewerRole,
      rating,
      comment: comment || null
    }
  });

  res.status(201).json({ data: review });
});

const listBookingReviews = asyncHandler(async (req, res) => {
  const { booking } = await getBookingForReviewOrThrow(req.params.id, req.user.email);

  res.json({ data: booking.reviews });
});

const listUserReviews = asyncHandler(async (req, res) => {
  const email = String(req.params.email || "").trim().toLowerCase();

  if (!email) {
    throw new HttpError(400, "Email is required.");
  }

  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeEmail: email },
      include: {
        booking: {
          include: { listing: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.review.aggregate({
      where: { revieweeEmail: email },
      _avg: { rating: true },
      _count: { rating: true }
    })
  ]);

  res.json({
    data: {
      reviews,
      averageRating: aggregate._avg.rating,
      reviewCount: aggregate._count.rating
    }
  });
});

module.exports = {
  createBookingReview,
  listBookingReviews,
  listUserReviews
};
