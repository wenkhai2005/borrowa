import { useEffect, useState } from "react";
import {
  deleteListing,
  getMyListings,
  getSellerBookings,
  getSellerDamageReports,
  getSellerEarnings,
  getSellerPendingBookings,
  getSellerRefundRequests,
  updateListing
} from "../api";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { formatDate, formatMoney } from "../utils/format";
import { getCurrentUser, isLoggedIn } from "../utils/auth";

const locations = ["Klang Valley", "Penang", "Melaka", "Johor"];

function getAccount() {
  return getCurrentUser();
}

export default function MyListingsPage() {
  const [account] = useState(() => getAccount());
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [damageReports, setDamageReports] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState(null);

  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!account || !loggedIn) {
      setLoading(false);
      return;
    }

    let mounted = true;

    Promise.all([
      getMyListings(),
      getSellerBookings(),
      getSellerPendingBookings(),
      getSellerRefundRequests(),
      getSellerDamageReports(),
      getSellerEarnings()
    ])
      .then(([listingData, bookingData, pendingBookingData, refundRequestData, damageReportData, earningsData]) => {
        if (mounted) {
          setListings(listingData);
          setBookings(bookingData);
          setPendingRequests(pendingBookingData);
          setRefundRequests(refundRequestData);
          setDamageReports(damageReportData);
          setEarningsSummary(earningsData.summary);
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
  }, [account, loggedIn]);

  function startEdit(listing) {
    setEditingId(listing.id);
    setEditForm({
      title: listing.title,
      description: listing.description,
      location: listing.location,
      dailyRate: Number(listing.dailyRate),
      isAvailable: listing.isAvailable
    });
  }

  function updateEditField(event) {
    const { name, value, type, checked } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function saveEdit(id) {
    setError(null);

    try {
      const updated = await updateListing(id, {
        ...editForm,
        dailyRate: Number(editForm.dailyRate)
      });

      setListings((current) => current.map((listing) => (listing.id === id ? updated : listing)));
      setEditingId(null);
    } catch (err) {
      setError(err);
    }
  }

  async function removeListing(id) {
    const shouldDelete = window.confirm("Delete this listing?");

    if (!shouldDelete) {
      return;
    }

    setError(null);

    try {
      await deleteListing(id);
      setListings((current) => current.filter((listing) => listing.id !== id));
    } catch (err) {
      setError(err);
    }
  }

  async function toggleAvailability(listing) {
    setError(null);
    setUpdatingAvailabilityId(listing.id);

    try {
      const updated = await updateListing(listing.id, {
        isAvailable: !listing.isAvailable
      });

      setListings((current) => current.map((item) => (item.id === listing.id ? updated : item)));
    } catch (err) {
      setError(err);
    } finally {
      setUpdatingAvailabilityId(null);
    }
  }

  if (!account || !loggedIn) {
    return (
      <section className="account-empty">
        <div className="auth-card">
          <p className="eyebrow">Owner tools</p>
          <h1>Login required</h1>
          <p className="auth-copy">Login to manage your listings.</p>
          <button className="primary-button full-width" onClick={() => navigate("/login")} type="button">
            Login
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return <LoadingState message="Loading your listings..." />;
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const confirmedRentals = bookings.filter((booking) => booking.status === "CONFIRMED");
  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED");
  const openDamageReports = damageReports.filter((report) => report.status === "OPEN");
  const sellerEarningsSummary = earningsSummary || {
    totalCompletedEarnings: 0,
    pendingPayout: 0,
    onHoldAmount: 0
  };
  const monthlyEarnings = bookings
    .filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      return booking.status === "CONFIRMED" && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    })
    .reduce((total, booking) => total + Number(booking.totalPrice || 0), 0);

  return (
    <section className="manage-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Owner tools</p>
          <h1>My Listings</h1>
        </div>
        <button className="primary-button" onClick={() => navigate("/listings/new")} type="button">
          Add Listing
        </button>
      </div>

      <section className="seller-dashboard" aria-label="Seller Dashboard">
        <div className="seller-dashboard-heading">
          <p className="eyebrow">Seller Dashboard</p>
          <h2>Performance Overview</h2>
        </div>
        <div className="seller-stat-grid">
          <article className="seller-stat-card">
            <span>Total Listings</span>
            <strong>{listings.length}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Confirmed Rentals</span>
            <strong>{confirmedRentals.length}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Pending Requests</span>
            <strong>{pendingRequests.length}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Pending Refund Requests</span>
            <strong>{refundRequests.length}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Open Damage Reports</span>
            <strong>{openDamageReports.length}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Completed Bookings</span>
            <strong>{completedBookings.length}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Monthly Earnings</span>
            <strong>{formatMoney(monthlyEarnings)}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Pending Payout</span>
            <strong>{formatMoney(sellerEarningsSummary.pendingPayout)}</strong>
          </article>
          <article className="seller-stat-card">
            <span>On Hold</span>
            <strong>{formatMoney(sellerEarningsSummary.onHoldAmount)}</strong>
          </article>
          <article className="seller-stat-card">
            <span>Total Completed Earnings</span>
            <strong>{formatMoney(sellerEarningsSummary.totalCompletedEarnings)}</strong>
          </article>
        </div>
        <div className="pending-request-preview">
          <div className="pending-request-header">
            <h3>Earnings Summary</h3>
            <button className="text-button" onClick={() => navigate("/seller/earnings")} type="button">
              View Earnings
            </button>
          </div>
          <p className="helper-text">
            Pending payout: {formatMoney(sellerEarningsSummary.pendingPayout)} · On hold: {formatMoney(sellerEarningsSummary.onHoldAmount)}
          </p>
        </div>
        <div className="pending-request-preview">
          <div className="pending-request-header">
            <h3>Latest Pending Requests</h3>
            <button className="text-button" onClick={() => navigate("/seller/requests")} type="button">
              View all
            </button>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="helper-text">No pending paid booking requests.</p>
          ) : (
            <div className="pending-request-list">
              {pendingRequests.slice(0, 3).map((booking) => (
                <article className="pending-request-item" key={booking.id}>
                  <div>
                    <strong>{booking.listing?.title || "Booking request"}</strong>
                    <span>{booking.renterName} · {formatDate(booking.startDate)} to {formatDate(booking.endDate)}</span>
                  </div>
                  <em>Pending</em>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="pending-request-preview">
          <div className="pending-request-header">
            <h3>Latest Refund Requests</h3>
            <button className="text-button" onClick={() => navigate("/seller/refund-requests")} type="button">
              View Refund Requests
            </button>
          </div>
          {refundRequests.length === 0 ? (
            <p className="helper-text">No pending refund requests.</p>
          ) : (
            <div className="pending-request-list">
              {refundRequests.slice(0, 3).map((booking) => (
                <article className="pending-request-item" key={booking.id}>
                  <div>
                    <strong>{booking.listing?.title || "Refund request"}</strong>
                    <span>{booking.renterName} · {booking.refundReason}</span>
                  </div>
                  <em>Refund requested</em>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="pending-request-preview">
          <div className="pending-request-header">
            <h3>Latest Damage Reports</h3>
            <button className="text-button" onClick={() => navigate("/seller/damage-reports")} type="button">
              View Damage Reports
            </button>
          </div>
          {damageReports.length === 0 ? (
            <p className="helper-text">No damage reports yet.</p>
          ) : (
            <div className="pending-request-list">
              {damageReports.slice(0, 3).map((report) => (
                <article className="pending-request-item" key={report.id}>
                  <div>
                    <strong>{report.booking?.listing?.title || "Damage report"}</strong>
                    <span>{report.title} · {report.renterEmail}</span>
                  </div>
                  <em>{report.status}</em>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <ErrorMessage error={error} />

      {listings.length === 0 && !error ? (
        <EmptyState
          title="No listings yet"
          message="Create your first rental listing to manage it here."
          action={
            <button className="primary-button" onClick={() => navigate("/listings/new")} type="button">
              Create Listing
            </button>
          }
        />
      ) : null}

      <div className="manage-list">
        {listings.map((listing) => (
          <article className="manage-card" key={listing.id}>
            <div className="manage-image">
              {Array.isArray(listing.imageUrls) && listing.imageUrls[0] ? (
                <img alt={listing.title} src={listing.imageUrls[0]} />
              ) : listing.imageUrl ? (
                <img alt={listing.title} src={listing.imageUrl} />
              ) : (
                <span>{listing.cameraBrand}</span>
              )}
            </div>

            {editingId === listing.id ? (
              <div className="manage-editor">
                <label>
                  Title
                  <input name="title" onChange={updateEditField} value={editForm.title} />
                </label>
                <label>
                  Description
                  <textarea name="description" onChange={updateEditField} rows="3" value={editForm.description} />
                </label>
                <div className="form-grid">
                  <label>
                    Location
                    <select name="location" onChange={updateEditField} value={editForm.location}>
                      {locations.map((location) => (
                        <option key={location}>{location}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Daily rate
                    <input min="1" name="dailyRate" onChange={updateEditField} type="number" value={editForm.dailyRate} />
                  </label>
                </div>
                <label className="checkbox-row">
                  <input checked={editForm.isAvailable} name="isAvailable" onChange={updateEditField} type="checkbox" />
                  Available for booking
                </label>
                <div className="button-row">
                  <button className="secondary-button" onClick={() => setEditingId(null)} type="button">
                    Cancel
                  </button>
                  <button className="primary-button" onClick={() => saveEdit(listing.id)} type="button">
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="manage-content">
                <div className="manage-details">
                  <div>
                    <p className="eyebrow">{listing.category}</p>
                    <h2>{listing.title}</h2>
                    <p>{listing.cameraBrand} {listing.cameraModel}</p>
                    <p className="meta">{listing.location}</p>
                  </div>
                  <div className="manage-meta">
                    <strong>{formatMoney(listing.dailyRate)} / day</strong>
                    <span className={listing.isAvailable ? "badge success" : "badge muted"}>
                      {listing.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <p className="description">{listing.description}</p>
                </div>
                <div className="listing-action-column">
                  <button
                    className={listing.isAvailable ? "secondary-button availability-button" : "primary-button availability-button"}
                    disabled={updatingAvailabilityId === listing.id}
                    onClick={() => toggleAvailability(listing)}
                    type="button"
                  >
                    {updatingAvailabilityId === listing.id
                      ? "Updating..."
                      : listing.isAvailable
                        ? "Set Unavailable"
                        : "Set Available"}
                  </button>
                  <button className="secondary-button" onClick={() => navigate(`/listings/${listing.id}`)} type="button">
                    View
                  </button>
                  <button className="secondary-button" onClick={() => navigate(`/seller/listings/${listing.id}/availability`)} type="button">
                    Manage Availability
                  </button>
                  <button className="secondary-button" onClick={() => startEdit(listing)} type="button">
                    Edit
                  </button>
                  <button className="danger-button" onClick={() => removeListing(listing.id)} type="button">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
