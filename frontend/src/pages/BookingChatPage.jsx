import BookingChat from "../components/BookingChat";
import { navigate } from "../router";

export default function BookingChatPage({ bookingId }) {
  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Booking conversation</p>
          <h1>Booking Chat</h1>
          <p className="helper-text">Coordinate pickup, return, and booking details here.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/bookings")} type="button">
          Back to My Bookings
        </button>
      </div>

      <BookingChat bookingId={bookingId} />
    </section>
  );
}
