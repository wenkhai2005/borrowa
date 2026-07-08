import { useEffect, useState } from "react";
import {
  acceptSellerBooking,
  completeSellerBooking,
  createSellerDamageReport,
  declineSellerBooking,
  getSellerBooking
} from "../api";
import BookingReviews from "../components/BookingReviews";
import BookingChat from "../components/BookingChat";
import { ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { getCurrentUser } from "../utils/auth";
import {
  formatDate,
  formatMoney,
  getBookingStatusClass,
  getBookingStatusLabel,
  getPayoutStatusClass,
  getPayoutStatusLabel,
  getRefundStatusClass,
  getRefundStatusLabel
} from "../utils/format";

const initialDamageForm = {
  title: "",
  description: "",
  claimAmount: "",
  imageUrls: ""
};

function DetailCard({ title, children }) {
  return (
    <article className="seller-request-card">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function FactGrid({ items }) {
  return (
    <dl className="request-facts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function getImageUrls(report) {
  return Array.isArray(report.imageUrls) ? report.imageUrls : [];
}

export default function SellerBookingDetailPage({ bookingId }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [updating, setUpdating] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [damageForm, setDamageForm] = useState(initialDamageForm);

  const account = getCurrentUser();

  async function loadBooking() {
    setError(null);

    try {
      const data = await getSellerBooking(bookingId);
      setBooking(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  async function runAction(action, message) {
    setUpdating(true);
    setError(null);
    setSuccessMessage("");

    try {
      await action();
      setSuccessMessage(message);
      setShowCompletionForm(false);
      setShowDamageForm(false);
      setCompletionNote("");
      setDamageForm(initialDamageForm);
      await loadBooking();
    } catch (err) {
      setError(err);
    } finally {
      setUpdating(false);
    }
  }

  function updateDamageField(event) {
    const { name, value } = event.target;
    setDamageForm((current) => ({ ...current, [name]: value }));
  }

  async function submitDamageReport(event) {
    event.preventDefault();
    const imageUrls = damageForm.imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    await runAction(
      () => createSellerDamageReport(booking.id, { ...damageForm, imageUrls }),
      "Damage report submitted."
    );
  }

  async function submitCompletion(event) {
    event.preventDefault();
    await runAction(() => completeSellerBooking(booking.id, completionNote), "Booking marked as completed.");
  }

  if (loading) {
    return <LoadingState message="Loading booking detail..." />;
  }

  if (!booking) {
    return (
      <section className="seller-requests-page">
        <ErrorMessage error={error} />
        <button className="secondary-button" onClick={() => navigate("/seller/requests")} type="button">
          Back to Booking Requests
        </button>
      </section>
    );
  }

  const listing = booking.listing || {};
  const damageReports = booking.damageReports || [];
  const canReportDamage = ["CONFIRMED", "COMPLETED"].includes(booking.status);
  const canComplete = booking.status === "CONFIRMED" && booking.refundStatus !== "REQUESTED";

  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller booking detail</p>
          <h1>{listing.title || "Booking Detail"}</h1>
          <p className="helper-text">Booking ID: {booking.id}</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/seller/requests")} type="button">
          Back to Booking Requests
        </button>
      </div>

      <ErrorMessage error={error} />
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      <DetailCard title="Booking Summary">
        <FactGrid
          items={[
            { label: "Booking ID", value: booking.id },
            { label: "Status", value: <span className={getBookingStatusClass(booking.status)}>{getBookingStatusLabel(booking.status)}</span> },
            { label: "Rental Dates", value: `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}` },
            { label: "Total Price", value: formatMoney(booking.totalPrice) },
            { label: "Platform Fee", value: formatMoney(booking.platformFee) },
            { label: "Seller Earnings", value: formatMoney(booking.sellerEarnings) },
            { label: "Payout Status", value: <span className={getPayoutStatusClass(booking.payoutStatus)}>{getPayoutStatusLabel(booking.payoutStatus)}</span> },
            { label: "Payout Date", value: formatDate(booking.payoutAt) }
          ]}
        />
      </DetailCard>

      <DetailCard title="Actions">
        {booking.refundStatus === "REQUESTED" ? (
          <div className="refund-reason-box">
            <strong>Refund request pending</strong>
            <p>Review this refund request before completing the booking.</p>
            <button className="secondary-button" onClick={() => navigate("/seller/refund-requests")} type="button">
              Go to Refund Requests
            </button>
          </div>
        ) : null}

        {booking.status === "PENDING" ? (
          <div className="button-row">
            <button
              className="primary-button"
              disabled={updating}
              onClick={() => runAction(() => acceptSellerBooking(booking.id), "Booking accepted.")}
              type="button"
            >
              Accept
            </button>
            <button
              className="danger-button"
              disabled={updating}
              onClick={() => runAction(() => declineSellerBooking(booking.id), "Booking declined.")}
              type="button"
            >
              Decline
            </button>
          </div>
        ) : null}

        {booking.status === "CONFIRMED" ? (
          <div className="button-row">
            {canComplete ? (
              <button className="primary-button" disabled={updating} onClick={() => setShowCompletionForm(true)} type="button">
                Mark as Completed
              </button>
            ) : null}
            <button className="danger-button" disabled={updating} onClick={() => setShowDamageForm(true)} type="button">
              Report Damage
            </button>
          </div>
        ) : null}

        {booking.status === "COMPLETED" ? (
          <button className="danger-button" disabled={updating} onClick={() => setShowDamageForm(true)} type="button">
            Report Damage
          </button>
        ) : null}

        {booking.status === "DISPUTED" ? (
          <p className="helper-text">This booking is disputed. Damage reports are listed below.</p>
        ) : null}

        {showCompletionForm ? (
          <form className="refund-request-form" onSubmit={submitCompletion}>
            <label>
              Completion note
              <textarea
                onChange={(event) => setCompletionNote(event.target.value)}
                placeholder="Example: Item returned in good condition"
                rows="3"
                value={completionNote}
              />
            </label>
            <div className="button-row">
              <button className="secondary-button" onClick={() => setShowCompletionForm(false)} type="button">
                Cancel
              </button>
              <button className="primary-button" disabled={updating} type="submit">
                Confirm Complete
              </button>
            </div>
          </form>
        ) : null}

        {showDamageForm && canReportDamage ? (
          <form className="refund-request-form" onSubmit={submitDamageReport}>
            <label>
              Damage title
              <input name="title" onChange={updateDamageField} placeholder="Example: Lens scratched" required value={damageForm.title} />
            </label>
            <label>
              Description
              <textarea name="description" onChange={updateDamageField} placeholder="Describe the damage" required rows="3" value={damageForm.description} />
            </label>
            <label>
              Claim amount
              <input min="0" name="claimAmount" onChange={updateDamageField} placeholder="300" type="number" value={damageForm.claimAmount} />
            </label>
            <label>
              Image URLs or base64, one per line
              <textarea name="imageUrls" onChange={updateDamageField} placeholder="https://example.com/damage-photo.jpg" rows="3" value={damageForm.imageUrls} />
            </label>
            <div className="button-row">
              <button className="secondary-button" onClick={() => setShowDamageForm(false)} type="button">
                Cancel
              </button>
              <button className="primary-button" disabled={updating} type="submit">
                Submit Damage Report
              </button>
            </div>
          </form>
        ) : null}
      </DetailCard>

      <DetailCard title="Listing Info">
        <div className="seller-request-top">
          <div className="seller-request-image">
            {listing.imageUrl ? <img alt={listing.title} src={listing.imageUrl} /> : <span>{listing.cameraBrand || "Gear"}</span>}
          </div>
          <FactGrid
            items={[
              { label: "Title", value: listing.title },
              { label: "Brand / Model", value: `${listing.cameraBrand || ""} ${listing.cameraModel || ""}`.trim() },
              { label: "Location", value: listing.location },
              { label: "Daily Rate", value: formatMoney(listing.dailyRate) },
              { label: "Deposit", value: formatMoney(listing.deposit) }
            ]}
          />
        </div>
      </DetailCard>

      <DetailCard title="Renter Info">
        <FactGrid
          items={[
            { label: "Name", value: booking.renterName },
            { label: "Email", value: booking.renterEmail }
          ]}
        />
      </DetailCard>

      <DetailCard title="Refund Info">
        <FactGrid
          items={[
            { label: "Refund Status", value: <span className={getRefundStatusClass(booking.refundStatus)}>{getRefundStatusLabel(booking.refundStatus)}</span> },
            { label: "Refund Reason", value: booking.refundReason },
            { label: "Requested At", value: formatDate(booking.refundRequestedAt) },
            { label: "Response Note", value: booking.refundResponseNote },
            { label: "Responded At", value: formatDate(booking.refundRespondedAt) }
          ]}
        />
      </DetailCard>

      <DetailCard title="Completion Info">
        <FactGrid
          items={[
            { label: "Completed At", value: formatDate(booking.completedAt) },
            { label: "Completion Note", value: booking.completionNote }
          ]}
        />
      </DetailCard>

      <DetailCard title="Booking Chat">
        <BookingChat bookingId={booking.id} />
      </DetailCard>

      <DetailCard title="Reviews">
        <BookingReviews booking={booking} onReviewCreated={loadBooking} />
      </DetailCard>

      <DetailCard title="Damage Reports">
        {damageReports.length === 0 ? (
          <p className="helper-text">No damage reports for this booking.</p>
        ) : (
          <div className="pending-request-list">
            {damageReports.map((report) => (
              <article className="pending-request-item" key={report.id}>
                <div>
                  <strong>{report.title}</strong>
                  <span>{report.description}</span>
                  <span>Claim: {report.claimAmount ? formatMoney(report.claimAmount) : "No amount"} · {report.status} · {formatDate(report.createdAt)}</span>
                  {getImageUrls(report).length > 0 ? (
                    <div className="damage-image-list">
                      {getImageUrls(report).map((url) => (
                        <a href={url} key={url} rel="noreferrer" target="_blank">
                          <img alt="Damage evidence" src={url} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </DetailCard>
    </section>
  );
}
