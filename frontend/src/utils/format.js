export function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR"
  }).format(amount);
}

export function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function toApiDate(dateValue) {
  return `${dateValue}T00:00:00.000Z`;
}

export function getDateDiffDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(toApiDate(startDate));
  const end = new Date(toApiDate(endDate));
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / millisecondsPerDay));
}

export function getBookingStatusLabel(status) {
  const labels = {
    PENDING: "Waiting for seller confirmation",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    DISPUTED: "Disputed",
    REFUNDED: "Refunded",
    CANCELLED: "Cancelled",
    DECLINED: "Declined",
    EXPIRED: "Expired"
  };

  return labels[status] || status;
}

export function getBookingStatusClass(status) {
  if (["CONFIRMED", "COMPLETED"].includes(status)) {
    return "booking-status active";
  }

  if (status === "PENDING") {
    return "booking-status warning";
  }

  return "booking-status cancelled";
}

export function getCountdownLabel(dateValue) {
  if (!dateValue) {
    return "No deadline";
  }

  const remainingMs = new Date(dateValue).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m remaining`;
  }

  return `${hours}h ${minutes}m remaining`;
}

export function getRefundStatusLabel(status) {
  const labels = {
    NONE: "No refund request",
    REQUESTED: "Refund requested",
    APPROVED: "Refund approved",
    REJECTED: "Refund rejected"
  };

  return labels[status] || status;
}

export function getRefundStatusClass(status) {
  if (status === "APPROVED") {
    return "badge success";
  }

  if (status === "REQUESTED") {
    return "badge warning";
  }

  if (status === "REJECTED") {
    return "badge danger";
  }

  return "badge muted";
}

export function getPayoutStatusLabel(status) {
  const labels = {
    NOT_READY: "Not ready",
    PENDING: "Pending payout",
    PAID: "Paid",
    HOLD: "On hold"
  };

  return labels[status] || status;
}

export function getPayoutStatusClass(status) {
  if (status === "PAID") {
    return "badge success";
  }

  if (status === "PENDING") {
    return "badge warning";
  }

  if (status === "HOLD") {
    return "badge danger";
  }

  return "badge muted";
}
