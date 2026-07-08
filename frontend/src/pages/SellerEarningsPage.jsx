import { useEffect, useState } from "react";
import { getSellerEarnings, markSellerPayoutPaid } from "../api";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";
import { formatDate, formatMoney, getBookingStatusClass, getBookingStatusLabel, getPayoutStatusClass, getPayoutStatusLabel } from "../utils/format";

const emptySummary = {
  totalCompletedEarnings: 0,
  pendingPayout: 0,
  paidPayout: 0,
  onHoldAmount: 0,
  platformFees: 0,
  completedBookingsCount: 0,
  disputedBookingsCount: 0
};

export default function SellerEarningsPage() {
  const [summary, setSummary] = useState(emptySummary);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadEarnings() {
    setError(null);

    try {
      const data = await getSellerEarnings();
      setSummary(data.summary || emptySummary);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEarnings();
  }, []);

  async function handleMarkPaid(bookingId) {
    setUpdatingId(bookingId);
    setError(null);
    setSuccessMessage("");

    try {
      await markSellerPayoutPaid(bookingId);
      setSuccessMessage("Payout marked as paid.");
      await loadEarnings();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <LoadingState message="Loading earnings..." />;
  }

  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller earnings</p>
          <h1>Earnings & Payouts</h1>
          <p className="helper-text">Mock payout summary calculated from completed bookings.</p>
        </div>
      </div>

      <ErrorMessage error={error} />
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      <div className="seller-stat-grid">
        <article className="seller-stat-card">
          <span>Total Completed Earnings</span>
          <strong>{formatMoney(summary.totalCompletedEarnings)}</strong>
        </article>
        <article className="seller-stat-card">
          <span>Pending Payout</span>
          <strong>{formatMoney(summary.pendingPayout)}</strong>
        </article>
        <article className="seller-stat-card">
          <span>Paid</span>
          <strong>{formatMoney(summary.paidPayout)}</strong>
        </article>
        <article className="seller-stat-card">
          <span>On Hold</span>
          <strong>{formatMoney(summary.onHoldAmount)}</strong>
        </article>
        <article className="seller-stat-card">
          <span>Platform Fees</span>
          <strong>{formatMoney(summary.platformFees)}</strong>
        </article>
      </div>

      {bookings.length === 0 && !error ? (
        <EmptyState title="No earnings yet" message="Completed and disputed bookings will appear here." />
      ) : (
        <div className="earnings-table">
          <div className="earnings-row earnings-row-head">
            <span>Listing</span>
            <span>Renter</span>
            <span>Dates</span>
            <span>Total</span>
            <span>Fee</span>
            <span>Earnings</span>
            <span>Status</span>
            <span>Payout</span>
            <span>Action</span>
          </div>
          {bookings.map((booking) => (
            <div className="earnings-row" key={booking.id}>
              <span>{booking.listing?.title || "Listing unavailable"}</span>
              <span>{booking.renterName}<br />{booking.renterEmail}</span>
              <span>{formatDate(booking.startDate)}<br />{formatDate(booking.endDate)}</span>
              <span>{formatMoney(booking.totalPrice)}</span>
              <span>{formatMoney(booking.platformFee)}</span>
              <span>{formatMoney(booking.sellerEarnings)}</span>
              <span><span className={getBookingStatusClass(booking.status)}>{getBookingStatusLabel(booking.status)}</span></span>
              <span>
                <span className={getPayoutStatusClass(booking.payoutStatus)}>{getPayoutStatusLabel(booking.payoutStatus)}</span>
                {booking.payoutAt ? <small>{formatDate(booking.payoutAt)}</small> : null}
              </span>
              <span>
                {booking.payoutStatus === "PENDING" ? (
                  <button
                    className="secondary-button"
                    disabled={updatingId === booking.id}
                    onClick={() => handleMarkPaid(booking.id)}
                    type="button"
                  >
                    {updatingId === booking.id ? "Updating..." : "Mark Paid"}
                  </button>
                ) : (
                  <span className="badge muted">No action</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
