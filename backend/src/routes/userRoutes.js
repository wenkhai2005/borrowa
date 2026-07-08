const express = require("express");
const { listUserReviews } = require("../controllers/reviewController");

const router = express.Router();

router.get("/:email/reviews", listUserReviews);

module.exports = router;
