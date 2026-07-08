const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const damageReportRoutes = require("./routes/damageReportRoutes");
const listingRoutes = require("./routes/listingRoutes");
const sellerBookingRoutes = require("./routes/sellerBookingRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/listings", listingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/damage-reports", damageReportRoutes);
app.use("/api/seller", sellerBookingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
