const { Prisma } = require("@prisma/client");

function isOverlapConstraintError(error) {
  const constraint = error.meta?.constraint;
  const databaseError = error.meta?.database_error || "";

  return (
    constraint === "Booking_no_overlapping_active_dates" ||
    databaseError.includes("Booking_no_overlapping_active_dates")
  );
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (isOverlapConstraintError(error)) {
      return res.status(409).json({
        message: "Listing is already booked for the selected dates."
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        message: "Booking conflict. Please retry with the latest availability."
      });
    }
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    message: error.message || "Internal server error",
    details: error.details
  });
}

module.exports = errorHandler;
