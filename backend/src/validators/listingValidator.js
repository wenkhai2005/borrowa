const HttpError = require("../utils/httpError");

const allowedCategories = ["Camera", "Lense", "Action Camera", "Accessories", "Others"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateListingPayload(payload, options = {}) {
  const { partial = false } = options;
  const errors = {};
  const data = {};

  const stringFields = [
    "title",
    "description",
    "category",
    "cameraBrand",
    "cameraModel",
    "location",
    "serialNumber",
    "includedItems"
  ];

  stringFields.forEach((field) => {
    if (payload[field] === undefined) {
      if (!partial) {
        errors[field] = "This field is required.";
      }
      return;
    }

    if (!isNonEmptyString(payload[field])) {
      errors[field] = "Must be a non-empty string.";
      return;
    }

    if (field === "category" && !allowedCategories.includes(payload[field].trim())) {
      errors.category = `Must be one of: ${allowedCategories.join(", ")}.`;
      return;
    }

    data[field] = payload[field].trim();
  });

  if (payload.dailyRate === undefined) {
    if (!partial) {
      errors.dailyRate = "This field is required.";
    }
  } else {
    const dailyRate = Number(payload.dailyRate);
    if (!Number.isFinite(dailyRate) || dailyRate <= 0) {
      errors.dailyRate = "Must be a positive number.";
    } else {
      data.dailyRate = dailyRate;
    }
  }

  if (payload.deposit === undefined) {
    if (!partial) {
      errors.deposit = "This field is required.";
    }
  } else {
    const deposit = Number(payload.deposit);
    if (!Number.isFinite(deposit) || deposit < 0) {
      errors.deposit = "Must be zero or a positive number.";
    } else {
      data.deposit = deposit;
    }
  }

  if (payload.imageUrl !== undefined) {
    if (payload.imageUrl === null || payload.imageUrl === "") {
      data.imageUrl = null;
    } else if (!isNonEmptyString(payload.imageUrl)) {
      errors.imageUrl = "Must be a string URL.";
    } else if (!isHttpUrl(payload.imageUrl.trim())) {
      errors.imageUrl = "Must be an http or https image URL.";
    } else {
      data.imageUrl = payload.imageUrl.trim();
    }
  }

  if (payload.imageUrls !== undefined) {
    if (payload.imageUrls === null) {
      data.imageUrls = null;
    } else if (!Array.isArray(payload.imageUrls)) {
      errors.imageUrls = "Must be an array of image URLs.";
    } else if (payload.imageUrls.length > 5) {
      errors.imageUrls = "Upload up to 5 images per listing.";
    } else {
      const imageUrls = payload.imageUrls.map((url) => (typeof url === "string" ? url.trim() : ""));
      const invalidUrl = imageUrls.find((url) => !url || !isHttpUrl(url));

      if (invalidUrl !== undefined) {
        errors.imageUrls = "Each image must be an http or https URL.";
      } else {
        data.imageUrls = imageUrls;
        data.imageUrl = imageUrls[0] || null;
      }
    }
  }

  if (payload.ownerName !== undefined) {
    if (!isNonEmptyString(payload.ownerName)) {
      errors.ownerName = "Must be a non-empty string.";
    } else {
      data.ownerName = payload.ownerName.trim();
    }
  }

  if (payload.ownerEmail !== undefined) {
    if (!isNonEmptyString(payload.ownerEmail)) {
      errors.ownerEmail = "Must be a non-empty string.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.ownerEmail.trim())) {
      errors.ownerEmail = "Must be a valid email address.";
    } else {
      data.ownerEmail = payload.ownerEmail.trim().toLowerCase();
    }
  }

  if (payload.isAvailable !== undefined) {
    if (typeof payload.isAvailable !== "boolean") {
      errors.isAvailable = "Must be a boolean.";
    } else {
      data.isAvailable = payload.isAvailable;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  return data;
}

module.exports = {
  validateListingPayload
};
