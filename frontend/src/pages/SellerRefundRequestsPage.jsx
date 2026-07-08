import { useEffect, useState } from "react";
import { approveSellerRefundRequest, getSellerRefundRequests, rejectSellerRefundRequest } from "../api";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { getCurrentUser, isLoggedIn } from "../utils/auth";
import { formatDate, formatMoney, getBookingStatusLabel, getRefundStatusClass, getRefundStatusLabel } from "../utils/format";

export default function SellerRefundRequestsPage() {
  const [account] = useState(() => getCurrentUser());
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function loadRequests() {
    if (!account || !isLoggedIn()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setRequests(await getSellerRefundRequests());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function updateNote(id, value) {
    setNotes((current) => ({ ...current, [id]: value }));
  }

  async function handleApprove(id) {
    setUpdatingId(id);
    setError(null);
    setSuccessMessage("");

    try {
      await approveSellerRefundRequest(id, notes[id] || "Approved. Refund will be processed.");
      setSuccessMessage("Refund approved.");
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(id) {
    setUpdatingId(id);
    setError(null);
    setSuccessMessage("");

    try {
      await rejectSellerRefundRequest(id, notes[id] || "Refund request rejected.");
      setSuccessMessage("Refund rejected.");
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  if (!account || !isLoggedIn()) {
    return (
      <section className="account-empty">
        <div className="auth-card">
          <p className="eyebrow">Refund requests</p>
          <h1>Login required</h1>
          <p className="auth-copy">Login as a seller to review refund requests.</p>
          <button className="primary-button full-width" onClick={() => navigate("/login")} type="button">
            Login
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return <LoadingState message="Loading refund requests..." />;
  }

  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller refunds</p>
          <h1>Refund Requests</h1>
          <p className="helper-text">Review renter refund requests for your listings.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/my-listings")} type="button">
          Back to Dashboard
        </button>
      </div>

      <ErrorMessage error={error} />
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      {requests.length === 0 ? (
        <EmptyState title="No refund requests" message="Pending refund requests will appear here." />
      ) : (
        <div className="seller-request-list">
          {requests.map((request) => (
            <article className="seller-request-card" key={request.id}>
              <div className="seller-request-top">
                <div className="seller-request-image">
                  {request.listing?.imageUrl ? (
                    <img alt={request.listing.title} src={request.listing.imageUrl} />
                  ) : (
                    <span>{request.listing?.cameraBrand || "Gear"}</span>
                  )}
                </div>
                <div>
                  <span className={getRefundStatusClass(request.refundStatus)}>{getRefundStatusLabel(request.refundStatus)}</span>
                  <h2>{request.listing?.title || "Refund request"}</h2>
                  <p className="meta">{request.listing?.cameraBrand} {request.listing?.cameraModel}</p>
                </div>
              </div>

              <dl className="request-facts">
                <div>
                  <dt>Renter</dt>
                  <dd>{request.renterName}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{request.renterEmail}</dd>
                </div>
                <div>
                  <dt>Dates</dt>
                  <dd>{formatDate(request.startDate)} to {formatDate(request.endDate)}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatMoney(request.totalPrice)}</dd>
                </div>
                <div>
                  <dt>Booking</dt>
                  <dd>{getBookingStatusLabel(request.status)}</dd>
                </div>
                <div>
                  <dt>Requested</dt>
                  <dd>{formatDate(request.refundRequestedAt)}</dd>
                </div>
              </dl>

              <div className="refund-reason-box">
                <strong>Refund reason</strong>
                <p>{request.refundReason}</p>
              </div>

              <label>
                Response note
                <textarea
                  onChange={(event) => updateNote(request.id, event.target.value)}
                  placeholder="Add a note for the renter"
                  rows="3"
                  value={notes[request.id] || ""}
                />
              </label>

              <div className="button-row">
                <button
                  className="primary-button"
                  disabled={updatingId === request.id}
                  onClick={() => handleApprove(request.id)}
                  type="button"
                >
                  {updatingId === request.id ? "Updating..." : "Approve Refund"}
                </button>
                <button
                  className="danger-button"
                  disabled={updatingId === request.id}
                  onClick={() => handleReject(request.id)}
                  type="button"
                >
                  Reject Refund
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
