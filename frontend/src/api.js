import { navigate } from "./router";
import { getToken, logout } from "./utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "Request failed");
    error.details = payload.details;
    error.status = response.status;

    if (response.status === 401) {
      logout();
      navigate("/login");
    }

    throw error;
  }

  return payload.data;
}

export function getListings(filters = {}) {
  const params = new URLSearchParams();

  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/listings${query}`);
}

export function getMyListings() {
  return request("/api/listings/mine");
}

export function registerUser(data) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function loginUser(data) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function getMe() {
  return request("/api/auth/me");
}

export function verifyEmail(token) {
  return request(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function resendVerificationEmail() {
  return request("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function getListing(id) {
  return request(`/api/listings/${id}`);
}

export function getListingAvailability(id) {
  return request(`/api/listings/${id}/availability`);
}

export function checkListingAvailability(id, data) {
  return request(`/api/listings/${id}/check-availability`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function createListing(data) {
  return request("/api/listings", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateListing(id, data) {
  return request(`/api/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export function deleteListing(id) {
  return request(`/api/listings/${id}`, {
    method: "DELETE"
  });
}

export function createBooking(data) {
  return request("/api/bookings", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function getBookings() {
  return request("/api/bookings");
}

export function cancelBooking(id) {
  return request(`/api/bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export function requestBookingRefund(id, reason) {
  return request(`/api/bookings/${id}/refund-request`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}

export function getBookingReviews(bookingId) {
  return request(`/api/bookings/${bookingId}/reviews`);
}

export function createBookingReview(bookingId, data) {
  return request(`/api/bookings/${bookingId}/reviews`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function getUserReviews(email) {
  return request(`/api/users/${encodeURIComponent(email)}/reviews`);
}

export function getBookingMessages(bookingId) {
  return request(`/api/bookings/${bookingId}/messages`);
}

export function sendBookingMessage(bookingId, message) {
  return request(`/api/bookings/${bookingId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}

export function markBookingMessagesRead(bookingId) {
  return request(`/api/bookings/${bookingId}/messages/read`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export function getSellerBookings() {
  return request("/api/seller/bookings");
}

export function getSellerBooking(id) {
  return request(`/api/seller/bookings/${id}`);
}

export function getSellerPendingBookings() {
  return request("/api/seller/bookings/pending");
}

export function acceptSellerBooking(id) {
  return request(`/api/seller/bookings/${id}/accept`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export function declineSellerBooking(id) {
  return request(`/api/seller/bookings/${id}/decline`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export function completeSellerBooking(id, note) {
  return request(`/api/seller/bookings/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ note })
  });
}

export function createSellerDamageReport(id, data) {
  return request(`/api/seller/bookings/${id}/damage-report`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function getSellerDamageReports() {
  return request("/api/seller/damage-reports");
}

export function getMyDamageReports() {
  return request("/api/damage-reports/my");
}

export function getSellerEarnings() {
  return request("/api/seller/earnings");
}

export function markSellerPayoutPaid(bookingId) {
  return request(`/api/seller/earnings/${bookingId}/mark-paid`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export function getSellerRefundRequests() {
  return request("/api/seller/refund-requests");
}

export function approveSellerRefundRequest(id, note) {
  return request(`/api/seller/refund-requests/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ note })
  });
}

export function rejectSellerRefundRequest(id, note) {
  return request(`/api/seller/refund-requests/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ note })
  });
}

export function getSellerListingUnavailableDates(id) {
  return request(`/api/seller/listings/${id}/unavailable-dates`);
}

export function createSellerListingUnavailableDate(id, data) {
  return request(`/api/seller/listings/${id}/unavailable-dates`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function deleteSellerUnavailableDate(id) {
  return request(`/api/seller/unavailable-dates/${id}`, {
    method: "DELETE"
  });
}
