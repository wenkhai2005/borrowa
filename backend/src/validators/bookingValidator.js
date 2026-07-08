const HttpError = require("../utils/httpError");
const { parseDate } = require("../utils/date");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateBookingPayload(payload) {
  const errors = {};
  const data = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isNonEmptyString(payload.listingId)) {
    errors.listingId = "This field is required.";
  } else {
    data.listingId = payload.listingId.trim();
  }

  if (!isNonEmptyString(payload.renterName)) {
    errors.renterName = "This field is required.";
  } else {
    data.renterName = payload.renterName.trim();
  }

  if (!isNonEmptyString(payload.renterEmail)) {
    errors.renterEmail = "This field is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.renterEmail.trim())) {
    errors.renterEmail = "Must be a valid email address.";
  } else {
    data.renterEmail = payload.renterEmail.trim().toLowerCase();
  }

  const startDate = parseDate(payload.startDate);
  const endDate = parseDate(payload.endDate);

  if (!startDate) {
    errors.startDate = "Must be a valid date.";
  }

  if (!endDate) {
    errors.endDate = "Must be a valid date.";
  }

  if (startDate && endDate && startDate >= endDate) {
    errors.endDate = "Must be after startDate.";
  }

  if (startDate && startDate < today) {
    errors.startDate = "Must not be in the past.";
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  data.startDate = startDate;
  data.endDate = endDate;

  return data;
}

module.exports = {
  validateBookingPayload
};
