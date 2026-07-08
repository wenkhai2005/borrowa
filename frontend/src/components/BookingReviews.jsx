import { useState } from "react";
import { createBookingReview } from "../api";
import { getCurrentUser } from "../utils/auth";
import { formatDate } from "../utils/format";
import { ErrorMessage } from "./Status";

function Stars({ value, onChange, disabled = false }) {
  return (
    <div className="star-rating" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          className={rating <= value ? "active" : ""}
          disabled={disabled}
          key={rating}
          onClick={() => onChange?.(rating)}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function BookingReviews({ booking, onReviewCreated }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const user = getCurrentUser();
  const reviews = booking.reviews || [];
  const reviewerRole = user?.role === "SELLER" ? "SELLER" : "RENTER";
  const ownReview = reviews.find((review) => review.reviewerEmail === user?.email || review.reviewerRole === reviewerRole);
  const canReview = booking.status === "COMPLETED" && user && !ownReview && ["RENTER", "SELLER"].includes(reviewerRole);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const review = await createBookingReview(booking.id, { rating, comment });
      setComment("");
      setRating(5);
      onReviewCreated?.(review);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviews-panel">
      <div className="reviews-panel-header">
        <h3>Reviews</h3>
        {ownReview ? <span className="badge success">Reviewed</span> : null}
      </div>

      {reviews.length === 0 ? (
        <p className="helper-text">No reviews yet.</p>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <div>
                <strong>{review.reviewerRole === "RENTER" ? "Renter review" : "Seller review"}</strong>
                <span>{review.reviewerEmail}</span>
              </div>
              <Stars value={review.rating} disabled />
              {review.comment ? <p>{review.comment}</p> : <p className="helper-text">No comment.</p>}
              <small>{formatDate(review.createdAt)}</small>
            </article>
          ))}
        </div>
      )}

      {booking.status !== "COMPLETED" ? (
        <p className="helper-text">Reviews unlock after the booking is completed.</p>
      ) : null}

      {canReview ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <ErrorMessage error={error} />
          <label>
            Rating
            <Stars value={rating} onChange={setRating} />
          </label>
          <label>
            Comment
            <textarea
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share your experience"
              rows="3"
              value={comment}
            />
          </label>
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
