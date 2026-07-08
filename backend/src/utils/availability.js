const HttpError = require("./httpError");
const { parseDate } = require("./date");

const activeBookingStatuses = ["PENDING", "CONFIRMED"];

function parseDateRange(payload) {
  const startDate = parseDate(payload.startDate);
  const endDate = parseDate(payload.endDate);
  const errors = {};

  if (!startDate) {
    errors.startDate = "Must be a valid date.";
  }

  if (!endDate) {
    errors.endDate = "Must be a valid date.";
  }

  if (startDate && endDate && startDate > endDate) {
    errors.endDate = "Must be on or after startDate.";
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  return { startDate, endDate };
}

function overlapWhere(startDate, endDate) {
  return {
    startDate: { lte: endDate },
    endDate: { gte: startDate }
  };
}

async function findOverlappingActiveBooking(tx, { listingId, startDate, endDate, excludeBookingId }) {
  return tx.booking.findFirst({
    where: {
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      listingId,
      status: { in: activeBookingStatuses },
      ...overlapWhere(startDate, endDate)
    }
  });
}

async function findOverlappingUnavailableDate(tx, { listingId, startDate, endDate, type, excludeId }) {
  return tx.listingUnavailableDate.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(type ? { type } : {}),
      listingId,
      ...overlapWhere(startDate, endDate)
    }
  });
}

async function getAvailabilityConflict(tx, { listingId, startDate, endDate, excludeBookingId, unavailableType }) {
  const overlappingBooking = await findOverlappingActiveBooking(tx, {
    listingId,
    startDate,
    endDate,
    excludeBookingId
  });

  if (overlappingBooking) {
    return {
      type: "BOOKING",
      reason: "Dates overlap with an active booking."
    };
  }

  const overlappingUnavailableDate = await findOverlappingUnavailableDate(tx, {
    listingId,
    startDate,
    endDate,
    type: unavailableType
  });

  if (overlappingUnavailableDate) {
    return {
      type: "UNAVAILABLE_DATE",
      reason: "Dates overlap with unavailable dates."
    };
  }

  return null;
}

async function removeBookingUnavailableDate(tx, bookingId) {
  return tx.listingUnavailableDate.deleteMany({
    where: {
      bookingId,
      type: "BOOKING"
    }
  });
}

module.exports = {
  activeBookingStatuses,
  findOverlappingActiveBooking,
  findOverlappingUnavailableDate,
  getAvailabilityConflict,
  parseDateRange,
  removeBookingUnavailableDate
};
