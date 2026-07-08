function parseDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function calculateBookingDays(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
}

module.exports = {
  calculateBookingDays,
  parseDate
};
