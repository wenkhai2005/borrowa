const HttpError = require("../utils/httpError");

const allowedRoles = ["RENTER", "SELLER"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongEnoughPassword(value) {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);
}

function validateRegisterPayload(payload) {
  const errors = {};

  if (!isNonEmptyString(payload.name)) {
    errors.name = "Name is required.";
  }

  if (!isNonEmptyString(payload.email)) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(payload.email.trim())) {
    errors.email = "Must be a valid email address.";
  }

  if (!isNonEmptyString(payload.password)) {
    errors.password = "Password is required.";
  } else if (!isStrongEnoughPassword(payload.password)) {
    errors.password = "Password must be at least 8 characters and include uppercase, lowercase, and number.";
  }

  if (!allowedRoles.includes(payload.role)) {
    errors.role = "Role must be RENTER or SELLER.";
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    role: payload.role
  };
}

function validateLoginPayload(payload) {
  const errors = {};

  if (!isNonEmptyString(payload.email)) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(payload.email.trim())) {
    errors.email = "Must be a valid email address.";
  }

  if (!isNonEmptyString(payload.password)) {
    errors.password = "Password is required.";
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  return {
    email: payload.email.trim().toLowerCase(),
    password: payload.password
  };
}

module.exports = {
  validateLoginPayload,
  validateRegisterPayload
};
