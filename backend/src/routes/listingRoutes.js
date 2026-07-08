const express = require("express");
const {
  checkListingAvailability,
  createListing,
  deleteListing,
  getListingAvailability,
  getListing,
  listMyListings,
  listListings,
  updateListing
} = require("../controllers/listingController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", listListings);
router.get("/mine", requireAuth, listMyListings);
router.post("/", requireAuth, createListing);
router.get("/:id/availability", getListingAvailability);
router.post("/:id/check-availability", checkListingAvailability);
router.get("/:id", getListing);
router.patch("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

module.exports = router;
