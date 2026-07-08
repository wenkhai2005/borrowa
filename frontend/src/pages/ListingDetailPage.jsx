import { useEffect, useState } from "react";
import { checkListingAvailability, createBooking, getListing, getListingAvailability } from "../api";
import { navigate } from "../router";
import { ErrorMessage, LoadingState } from "../components/Status";
import { formatDate, formatMoney, getDateDiffDays, toApiDate } from "../utils/format";
import { getCurrentUser, isLoggedIn } from "../utils/auth";

const bookingInitialState = {
  startDate: "",
  endDate: ""
};

export default function ListingDetailPage({ listingId }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingForm, setBookingForm] = useState(bookingInitialState);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [availability, setAvailability] = useState({ unavailableDates: [], activeBookings: [] });
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([getListing(listingId), getListingAvailability(listingId)])
      .then(([data, availabilityData]) => {
        if (mounted) {
          setListing(data);
          setAvailability(availabilityData);
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
  }, [listingId]);

  useEffect(() => {
    let mounted = true;

    async function runAvailabilityCheck() {
      setAvailabilityStatus(null);

      if (!bookingForm.startDate || !bookingForm.endDate) {
        return;
      }

      try {
        const result = await checkListingAvailability(listingId, {
          startDate: toApiDate(bookingForm.startDate),
          endDate: toApiDate(bookingForm.endDate)
        });

        if (mounted) {
          setAvailabilityStatus(result);
        }
      } catch (err) {
        if (mounted) {
          setAvailabilityStatus({
            available: false,
            reason: err.message
          });
        }
      }
    }

    runAvailabilityCheck();

    return () => {
      mounted = false;
    };
  }, [bookingForm.startDate, bookingForm.endDate, listingId]);

  function updateBookingField(event) {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  }

  async function handleBookingSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const user = getCurrentUser();

      if (!isLoggedIn() || !user) {
        navigate("/login");
        return;
      }

      if (user.role !== "RENTER") {
        throw new Error("Only renter accounts can create bookings.");
      }

      const booking = await createBooking({
        listingId,
        startDate: toApiDate(bookingForm.startDate),
        endDate: toApiDate(bookingForm.endDate)
      });

      setBookingSuccess("Booking request submitted. Waiting for seller confirmation.");
      setBookingForm(bookingInitialState);
      setListing(await getListing(listingId));
      setAvailability(await getListingAvailability(listingId));
    } catch (err) {
      setBookingError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading listing..." />;
  }

  if (error) {
    return (
      <section>
        <ErrorMessage error={error} />
        <button className="secondary-button" onClick={() => navigate("/")} type="button">
          Back to Listings
        </button>
      </section>
    );
  }

  const days = getDateDiffDays(bookingForm.startDate, bookingForm.endDate);
  const estimatedTotal = days * Number(listing.dailyRate);
  const activeBookings = availability.activeBookings || [];
  const unavailableDates = availability.unavailableDates || [];
  const visibleActiveBookings = activeBookings;
  const bookingDisabled =
    submitting ||
    !listing.isAvailable ||
    (availabilityStatus && !availabilityStatus.available);

  return (
    <section>
      <button className="text-button" onClick={() => navigate("/")} type="button">
        Back to listings
      </button>

      <div className="detail-layout">
        <article className="detail-main">
          <div className="detail-image">
            {listing.imageUrl ? (
              <img alt={listing.title} src={listing.imageUrl} />
            ) : (
              <span>{listing.cameraBrand}</span>
            )}
          </div>
          <div className="detail-content">
            <div className="listing-title-row">
              <div>
                <p className="eyebrow">{listing.cameraBrand} {listing.cameraModel}</p>
                <h1>{listing.title}</h1>
              </div>
              <span className={listing.isAvailable ? "badge success" : "badge muted"}>
                {listing.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
            <p className="description">{listing.description}</p>
            <div className="seller-rating-row">
              {listing.sellerAverageRating ? (
                <span className="rating">★ {Number(listing.sellerAverageRating).toFixed(1)} seller rating <small>({listing.sellerReviewCount})</small></span>
              ) : (
                <span className="rating muted">No seller reviews yet</span>
              )}
            </div>
            <dl className="facts">
              <div>
                <dt>Location</dt>
                <dd>{listing.location}</dd>
              </div>
              <div>
                <dt>Daily rate</dt>
                <dd>{formatMoney(listing.dailyRate)}</dd>
              </div>
            </dl>
          </div>
        </article>

        <aside className="booking-panel">
          <h2>Create Booking</h2>
          <p className="helper-text">End date is checkout date and is not charged.</p>
          <form onSubmit={handleBookingSubmit}>
            <ErrorMessage error={bookingError} />
            {bookingSuccess ? <div className="success-box">{bookingSuccess}</div> : null}

            <p className="helper-text">Your logged-in renter account will be used for this booking.</p>

            <div className="form-grid">
              <label>
                Start date
                <input name="startDate" onChange={updateBookingField} required type="date" value={bookingForm.startDate} />
              </label>

              <label>
                End date
                <input name="endDate" onChange={updateBookingField} required type="date" value={bookingForm.endDate} />
              </label>
            </div>

            <div className="total-row">
              <span>{days || 0} day{days === 1 ? "" : "s"}</span>
              <strong>{formatMoney(estimatedTotal)}</strong>
            </div>

            {availabilityStatus ? (
              <div className={availabilityStatus.available ? "success-box" : "error-box"}>
                <strong>{availabilityStatus.available ? "Selected dates are available." : availabilityStatus.reason}</strong>
              </div>
            ) : null}

            <button className="primary-button full-width" disabled={bookingDisabled} type="submit">
              {submitting ? "Processing..." : "Pay & Request Booking"}
            </button>
          </form>

          <div className="booked-dates">
            <h3>Unavailable Dates</h3>
            {visibleActiveBookings.length === 0 && unavailableDates.length === 0 ? (
              <p className="helper-text">No unavailable dates yet.</p>
            ) : (
              <ul>
                {unavailableDates.map((dateRange) => (
                  <li key={`${dateRange.type}-${dateRange.startDate}-${dateRange.endDate}`}>
                    {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)} · {dateRange.type === "BOOKING" ? "Booked" : dateRange.reason || "Unavailable"}
                  </li>
                ))}
                {visibleActiveBookings.map((booking) => (
                  <li key={`${booking.status}-${booking.startDate}-${booking.endDate}`}>
                    {formatDate(booking.startDate)} to {formatDate(booking.endDate)} · {booking.status === "PENDING" ? "Pending booking" : "Confirmed booking"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
