const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadListingImages } = require("../controllers/uploadController");
const requireAuth = require("../middleware/requireAuth");
const HttpError = require("../utils/httpError");

const router = express.Router();
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      callback(new HttpError(400, "Only jpg, jpeg, png, and webp images are allowed."));
      return;
    }

    callback(null, true);
  }
});

function handleMulterError(error, req, res, next) {
  if (!error) {
    next();
    return;
  }

  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Each image must be 5MB or smaller."
      : "Upload up to 5 images per listing.";
    next(new HttpError(400, message));
    return;
  }

  next(error);
}

router.post(
  "/listing-images",
  requireAuth,
  upload.array("images", 5),
  handleMulterError,
  uploadListingImages
);

module.exports = router;
