import { useEffect, useState } from "react";
import { cancelBooking, getBookings, requestBookingRefund } from "../api";
import { navigate } from "../router";
import BookingReviews from "../components/BookingReviews";
import ChatPreview from "../components/ChatPreview";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";
import { formatDate, formatMoney, getBookingStatusClass, getBookingStatusLabel, getRefundStatusClass, getRefundStatusLabel } from "../utils/format";
import { getCurrentUser, isLoggedIn } from "../utils/auth";

function getAccount() {
  return getCurrentUser();
}

export default function MyBookingsPage() {
  const [account] = useState(() => getAccount());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [refundBookingId, setRefundBookingId] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const loggedIn = isLoggedIn();
  const renterEmail = account?.email || "";

  useEffect(() => {
    if (!renterEmail || !loggedIn) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    getBookings()
      .then((data) => {
        if (mounted) {
          setBookings(data);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [renterEmail, loggedIn]);

  async function handleCancel(id) {
    setActionError(null);

    try {
      const updatedBooking = await cancelBooking(id);
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id ? updatedBooking : booking
        )
      );
    } catch (err) {
      setActionError(err);
    }
  }

  async function handleRefundSubmit(event) {
    event.preventDefault();
    setActionError(null);
    setSuccessMessage("");
    setSubmittingRefund(true);

    try {
      const updatedBooking = await requestBookingRefund(refundBookingId, refundReason);
      setBookings((current) =>
        current.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking))
      );
      setSuccessMessage("Refund request submitted.");
      setRefundBookingId(null);
      setRefundReason("");
    } catch (err) {
      setActionError(err);
    } finally {
      setSubmittingRefund(false);
    }
  }

  function canRequestRefund(booking) {
    return ["CONFIRMED", "CANCELLED"].includes(booking.status) && ["NONE", "REJECTED", undefined, null].includes(booking.refundStatus);
  }

  function handleReviewCreated(bookingId, review) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId
          ? { ...booking, reviews: [...(booking.reviews || []), review] }
          : booking
      )
    );
    setSuccessMessage("Review submitted.");
  }

  if (!loggedIn || !renterEmail) {
    return (
      <section className="account-empty">
        <div className="auth-card">
          <p className="eyebrow">Rental history</p>
          <h1>Login required</h1>
          <p className="auth-copy">Login to view your camera rental bookings.</p>
          <button className="primary-button full-width" onClick={() => navigate("/login")} type="button">
            Login
          </button>
        </div>
      </section>
    );
  }

  const activeBookings = bookings.filter((booking) => ["PENDING", "CONFIRMED"].includes(booking.status));
  const cancelledBookings = bookings.filter((booking) => booking.status === "CANCELLED");
  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED");
  const disputedBookings = bookings.filter((booking) => booking.status === "DISPUTED");

  return (
    <section className="bookings-page">
      <div className="bookings-hero">
        <div>
          <p className="eyebrow">Rental history</p>
          <h1>My Bookings</h1>
          <p>Bookings for {renterEmail}</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/")} type="button">
          Browse Gear
        </button>
      </div>

      <div className="booking-summary-grid">
        <article>
          <span>Total bookings</span>
          <strong>{bookings.length}</strong>
        </article>
        <article>
          <span>Active bookings</span>
          <strong>{activeBookings.length}</strong>
        </article>
        <article>
          <span>Cancelled</span>
          <strong>{cancelledBookings.length}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>{completedBookings.length}</strong>
        </article>
        <article>
          <span>Disputed</span>
          <strong>{disputedBookings.length}</strong>
        </article>
      </div>

      <ErrorMessage error={error || actionError} />
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      {loading ? <LoadingState message="Loading bookings..." /> : null}

      {!loading && bookings.length === 0 && !error ? (
        <EmptyState
          title="No bookings found"
          message="Your future camera rentals will appear here."
          action={
            <button className="primary-button" onClick={() => navigate("/")} type="button">
              Browse Listings
            </button>
          }
        />
      ) : null}

      <div className="booking-list">
        {bookings.map((booking) => (
          <article className="booking-card" key={booking.id}>
            <div className="booking-image">
              {booking.listing?.imageUrl ? (
                <img alt={booking.listing.title} src={booking.listing.imageUrl} />
              ) : (
                <span>{booking.listing?.cameraBrand || "Gear"}</span>
              )}
            </div>
            <div className="booking-main">
              <div>
                <span className={getBookingStatusClass(booking.status)}>
                  {getBookingStatusLabel(booking.status)}
                </span>
                <h2>{booking.listing?.title || "Camera booking"}</h2>
                <p className="booking-dates">{formatDate(booking.startDate)} to {formatDate(booking.endDate)}</p>
                <p className="meta">{booking.listing?.location || "Location unavailable"}</p>
                {booking.completedAt ? (
                  <p className="helper-text">Completed on {formatDate(booking.completedAt)}</p>
                ) : null}
                {booking.completionNote ? (
                  <p className="helper-text">Completion note: {booking.completionNote}</p>
                ) : null}
                {booking.status === "DISPUTED" ? (
                  <p className="helper-text">A damage dispute has been reported for this booking.</p>
                ) : null}
                {booking.refundStatus && booking.refundStatus !== "NONE" ? (
                  <span className={getRefundStatusClass(booking.refundStatus)}>
                    {getRefundStatusLabel(booking.refundStatus)}
                  </span>
                ) : null}
                {booking.refundResponseNote ? (
                  <p className="helper-text">Refund response: {booking.refundResponseNote}</p>
                ) : null}
              </div>
              <div className="booking-details-row">
                <span>{booking.listing?.cameraBrand} {booking.listing?.cameraModel}</span>
                <strong>{formatMoney(booking.totalPrice)}</strong>
              </div>
              <ChatPreview summary={booking.chatSummary} />
            </div>
            <div className="booking-card-side">
              <button className="secondary-button" onClick={() => navigate(`/bookings/${booking.id}/chat`)} type="button">
                Open Chat
              </button>
              {["PENDING", "CONFIRMED"].includes(booking.status) ? (
                <button className="secondary-button" onClick={() => handleCancel(booking.id)} type="button">
                  Cancel
                </button>
              ) : (
                <span className="badge muted">{getBookingStatusLabel(booking.status)}</span>
              )}
              {canRequestRefund(booking) ? (
                <button className="secondary-button" onClick={() => setRefundBookingId(booking.id)} type="button">
                  Request Refund
                </button>
              ) : null}
              {booking.status === "DISPUTED" ? (
                <button className="secondary-button" onClick={() => navigate("/my-damage-reports")} type="button">
                  View Damage Reports
                </button>
              ) : null}
            </div>
            {refundBookingId === booking.id ? (
              <form className="refund-request-form" onSubmit={handleRefundSubmit}>
                <label>
                  Refund reason
                  <textarea
                    onChange={(event) => setRefundReason(event.target.value)}
                    placeholder="Explain why you are requesting a refund"
                    required
                    rows="3"
                    value={refundReason}
                  />
                </label>
                <div className="button-row">
                  <button className="secondary-button" onClick={() => setRefundBookingId(null)} type="button">
                    Cancel
                  </button>
                  <button className="primary-button" disabled={submittingRefund} type="submit">
                    {submittingRefund ? "Submitting..." : "Submit Refund Request"}
                  </button>
                </div>
              </form>
            ) : null}
            {booking.status === "COMPLETED" ? (
              <BookingReviews booking={booking} onReviewCreated={(review) => handleReviewCreated(booking.id, review)} />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
