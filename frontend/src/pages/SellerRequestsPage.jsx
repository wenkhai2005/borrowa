import { useEffect, useState } from "react";
import { acceptSellerBooking, completeSellerBooking, createSellerDamageReport, declineSellerBooking, getSellerBookings } from "../api";
import ChatPreview from "../components/ChatPreview";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { formatDate, formatMoney, getBookingStatusClass, getBookingStatusLabel } from "../utils/format";
import { getCurrentUser, isLoggedIn } from "../utils/auth";

function getAccount() {
  return getCurrentUser();
}

const initialDamageForm = {
  title: "",
  description: "",
  claimAmount: "",
  imageUrls: ""
};

export default function SellerRequestsPage() {
  const [account] = useState(() => getAccount());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [completionBookingId, setCompletionBookingId] = useState(null);
  const [completionNote, setCompletionNote] = useState("");
  const [damageBookingId, setDamageBookingId] = useState(null);
  const [damageForm, setDamageForm] = useState(initialDamageForm);

  const loggedIn = isLoggedIn();

  async function loadRequests() {
    if (!account || !loggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSellerBookings();
      setRequests(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleAccept(id) {
    setUpdatingId(id);
    setError(null);
    setSuccessMessage("");

    try {
      await acceptSellerBooking(id);
      setSuccessMessage("Booking accepted.");
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDecline(id) {
    setUpdatingId(id);
    setError(null);
    setSuccessMessage("");

    try {
      await declineSellerBooking(id);
      setSuccessMessage("Booking declined.");
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleComplete(event) {
    event.preventDefault();
    setUpdatingId(completionBookingId);
    setError(null);
    setSuccessMessage("");

    try {
      await completeSellerBooking(completionBookingId, completionNote);
      setSuccessMessage("Booking marked as completed.");
      setCompletionBookingId(null);
      setCompletionNote("");
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  function updateDamageField(event) {
    const { name, value } = event.target;
    setDamageForm((current) => ({ ...current, [name]: value }));
  }

  async function handleDamageSubmit(event) {
    event.preventDefault();
    setUpdatingId(damageBookingId);
    setError(null);
    setSuccessMessage("");

    const imageUrls = damageForm.imageUrls
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    try {
      await createSellerDamageReport(damageBookingId, {
        title: damageForm.title,
        description: damageForm.description,
        claimAmount: damageForm.claimAmount,
        imageUrls
      });
      setSuccessMessage("Damage report submitted.");
      setDamageBookingId(null);
      setDamageForm(initialDamageForm);
      await loadRequests();
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingId(null);
    }
  }

  if (!account || !loggedIn) {
    return (
      <section className="account-empty">
        <div className="auth-card">
          <p className="eyebrow">Seller requests</p>
          <h1>Login required</h1>
          <p className="auth-copy">Login to review booking requests for your listings.</p>
          <button className="primary-button full-width" onClick={() => navigate("/login")} type="button">
            Login
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return <LoadingState message="Loading seller requests..." />;
  }

  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller requests</p>
          <h1>Booking Requests</h1>
          <p className="helper-text">Review renter booking requests and accept or decline pending requests.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/my-listings")} type="button">
          Back to My Listings
        </button>
      </div>

      <ErrorMessage error={error} />
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      {requests.length === 0 ? (
        <EmptyState title="No booking requests" message="Renter booking requests for your listings will appear here." />
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
                  <span className={getBookingStatusClass(request.status)}>
                    {getBookingStatusLabel(request.status)}
                  </span>
                  <h2>{request.listing?.title || "Booking request"}</h2>
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
              </dl>

              <ChatPreview summary={request.chatSummary} />

              <div className="button-row">
                <button className="secondary-button" onClick={() => navigate(`/seller/bookings/${request.id}`)} type="button">
                  View Details
                </button>
                <button className="secondary-button" onClick={() => navigate(`/seller/bookings/${request.id}`)} type="button">
                  Chat
                </button>
              </div>

              {request.status === "PENDING" ? (
                <div className="request-actions">
                  <strong>Action required</strong>
                  <div className="button-row">
                    <button
                      className="primary-button"
                      disabled={updatingId === request.id}
                      onClick={() => handleAccept(request.id)}
                      type="button"
                    >
                      {updatingId === request.id ? "Updating..." : "Accept"}
                    </button>
                    <button
                      className="danger-button"
                      disabled={updatingId === request.id}
                      onClick={() => handleDecline(request.id)}
                      type="button"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ) : null}
              {request.status === "CONFIRMED" ? (
                <div className="request-actions">
                  <strong>Return / completion</strong>
                  <div className="button-row">
                    {request.refundStatus !== "REQUESTED" ? (
                      <button
                        className="primary-button"
                        disabled={updatingId === request.id}
                        onClick={() => {
                          setCompletionBookingId(request.id);
                          setCompletionNote("");
                        }}
                        type="button"
                      >
                        Mark as Completed
                      </button>
                    ) : null}
                    <button
                      className="danger-button"
                      disabled={updatingId === request.id}
                      onClick={() => {
                        setDamageBookingId(request.id);
                        setDamageForm(initialDamageForm);
                      }}
                      type="button"
                    >
                      Report Damage
                    </button>
                  </div>
                </div>
              ) : null}
              {request.status === "COMPLETED" ? (
                <div className="request-actions">
                  <strong>After return</strong>
                  <button
                    className="danger-button"
                    disabled={updatingId === request.id}
                    onClick={() => {
                      setDamageBookingId(request.id);
                      setDamageForm(initialDamageForm);
                    }}
                    type="button"
                  >
                    Report Damage
                  </button>
                </div>
              ) : null}
              {request.completedAt ? (
                <p className="helper-text">Completed on {formatDate(request.completedAt)}</p>
              ) : null}
              {request.completionNote ? (
                <p className="helper-text">Completion note: {request.completionNote}</p>
              ) : null}
              {completionBookingId === request.id ? (
                <form className="refund-request-form" onSubmit={handleComplete}>
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
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setCompletionBookingId(null);
                        setCompletionNote("");
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button className="primary-button" disabled={updatingId === request.id} type="submit">
                      {updatingId === request.id ? "Updating..." : "Confirm Complete"}
                    </button>
                  </div>
                </form>
              ) : null}
              {damageBookingId === request.id ? (
                <form className="refund-request-form" onSubmit={handleDamageSubmit}>
                  <label>
                    Damage title
                    <input
                      name="title"
                      onChange={updateDamageField}
                      placeholder="Example: Lens scratched"
                      required
                      value={damageForm.title}
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      name="description"
                      onChange={updateDamageField}
                      placeholder="Describe the damage"
                      required
                      rows="3"
                      value={damageForm.description}
                    />
                  </label>
                  <label>
                    Claim amount
                    <input
                      min="0"
                      name="claimAmount"
                      onChange={updateDamageField}
                      placeholder="300"
                      type="number"
                      value={damageForm.claimAmount}
                    />
                  </label>
                  <label>
                    Image URLs or base64, one per line
                    <textarea
                      name="imageUrls"
                      onChange={updateDamageField}
                      placeholder="https://example.com/damage-photo.jpg"
                      rows="3"
                      value={damageForm.imageUrls}
                    />
                  </label>
                  <div className="button-row">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setDamageBookingId(null);
                        setDamageForm(initialDamageForm);
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button className="primary-button" disabled={updatingId === request.id} type="submit">
                      {updatingId === request.id ? "Submitting..." : "Submit Damage Report"}
                    </button>
                  </div>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
