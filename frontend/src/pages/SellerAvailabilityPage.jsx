import { useEffect, useState } from "react";
import {
  createSellerListingUnavailableDate,
  deleteSellerUnavailableDate,
  getListing,
  getSellerListingUnavailableDates
} from "../api";
import { ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { formatDate } from "../utils/format";

const initialForm = {
  startDate: "",
  endDate: "",
  reason: ""
};

export default function SellerAvailabilityPage({ listingId }) {
  const [listing, setListing] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadAvailability() {
    setLoading(true);
    setError(null);

    try {
      const [listingData, unavailableDateData] = await Promise.all([
        getListing(listingId),
        getSellerListingUnavailableDates(listingId)
      ]);
      setListing(listingData);
      setUnavailableDates(unavailableDateData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvailability();
  }, [listingId]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage("");

    try {
      await createSellerListingUnavailableDate(listingId, form);
      setForm(initialForm);
      setSuccessMessage("Unavailable date range added.");
      await loadAvailability();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError(null);
    setSuccessMessage("");

    try {
      await deleteSellerUnavailableDate(id);
      setSuccessMessage("Unavailable date range deleted.");
      await loadAvailability();
    } catch (err) {
      setError(err);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <LoadingState message="Loading availability..." />;
  }

  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller availability</p>
          <h1>{listing?.title || "Manage Availability"}</h1>
          <p className="helper-text">Block dates when this listing cannot be rented.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/my-listings")} type="button">
          Back to My Listings
        </button>
      </div>

      <ErrorMessage error={error} />
      {successMessage ? <div className="success-box">{successMessage}</div> : null}

      <div className="seller-request-list">
        <article className="seller-request-card">
          <h2>Add unavailable dates</h2>
          <form className="refund-request-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Start date
                <input name="startDate" onChange={updateField} required type="date" value={form.startDate} />
              </label>
              <label>
                End date
                <input name="endDate" onChange={updateField} required type="date" value={form.endDate} />
              </label>
            </div>
            <label>
              Reason
              <textarea
                name="reason"
                onChange={updateField}
                placeholder="Example: Personal use"
                rows="3"
                value={form.reason}
              />
            </label>
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Adding..." : "Add Unavailable Dates"}
            </button>
          </form>
        </article>

        <article className="seller-request-card">
          <h2>Unavailable date ranges</h2>
          {unavailableDates.length === 0 ? (
            <p className="helper-text">No unavailable date ranges yet.</p>
          ) : (
            <div className="pending-request-list">
              {unavailableDates.map((dateRange) => (
                <article className="pending-request-item" key={dateRange.id}>
                  <div>
                    <strong>{formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}</strong>
                    <span>{dateRange.reason || (dateRange.type === "BOOKING" ? "Confirmed booking" : "Unavailable")}</span>
                  </div>
                  <div className="button-row">
                    <em>{dateRange.type === "BOOKING" ? "Locked booking" : "Seller blocked"}</em>
                    {dateRange.type === "SELLER_BLOCKED" ? (
                      <button
                        className="danger-button"
                        disabled={deletingId === dateRange.id}
                        onClick={() => handleDelete(dateRange.id)}
                        type="button"
                      >
                        {deletingId === dateRange.id ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
