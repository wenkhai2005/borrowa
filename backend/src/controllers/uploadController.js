const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const requireVerifiedEmail = require("../utils/requireVerifiedEmail");
const { uploadImageBuffer } = require("../utils/cloudinary");

const uploadListingImages = asyncHandler(async (req, res) => {
  if (req.user.role !== "SELLER") {
    throw new HttpError(403, "Seller account required.");
  }
  requireVerifiedEmail(req.user);

  const files = req.files || [];

  if (files.length === 0) {
    throw new HttpError(400, "At least one image is required.");
  }

  if (files.length > 5) {
    throw new HttpError(400, "Upload up to 5 images per listing.");
  }

  const urls = await Promise.all(files.map((file) => uploadImageBuffer(file)));

  res.status(201).json({ data: { urls } });
});

module.exports = {
  uploadListingImages
};
