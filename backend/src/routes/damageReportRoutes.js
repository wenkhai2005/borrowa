const express = require("express");
const { listMyDamageReports } = require("../controllers/damageReportController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);

router.get("/my", listMyDamageReports);

module.exports = router;
