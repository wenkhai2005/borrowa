import { useEffect, useRef, useState } from "react";
import { getBookingMessages, markBookingMessagesRead, sendBookingMessage } from "../api";
import { ErrorMessage, LoadingState } from "./Status";
import { getCurrentUser } from "../utils/auth";

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function BookingChat({ bookingId }) {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const user = getCurrentUser();

  async function loadMessages({ markRead = false } = {}) {
    setError(null);

    try {
      const payload = await getBookingMessages(bookingId);
      const nextMessages = Array.isArray(payload) ? payload : payload.messages || [];
      setMessages(nextMessages);
      setUnreadCount(Array.isArray(payload) ? 0 : payload.unreadCount || 0);

      if (markRead) {
        await markBookingMessagesRead(bookingId);
        setUnreadCount(0);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadMessages({ markRead: true });
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await sendBookingMessage(bookingId, draft);
      setDraft("");
      await loadMessages();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="booking-chat">
      <div className="booking-chat-header">
        <div>
          <h2>Booking Chat</h2>
          <p className="helper-text">Messages are visible only to the renter and seller.</p>
        </div>
        <button className="secondary-button" onClick={loadMessages} type="button">
          Refresh
        </button>
      </div>

      <ErrorMessage error={error} />

      {loading ? <LoadingState message="Loading messages..." /> : null}

      {!loading ? (
        <div className="booking-chat-messages">
          {messages.length === 0 ? (
            <p className="helper-text">No messages yet.</p>
          ) : (
            messages.map((message) => {
              const isMine = message.senderEmail === user?.email;
              return (
                <article className={isMine ? "chat-bubble mine" : "chat-bubble"} key={message.id}>
                  <div>
                    <strong>{message.senderName}</strong>
                    <span>{message.senderRole} · {formatMessageTime(message.createdAt)}</span>
                  </div>
                  <p>{message.message}</p>
                </article>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : null}

      <form className="booking-chat-form" onSubmit={handleSubmit}>
        {unreadCount > 0 ? <span className="chat-unread-note">{unreadCount} unread message{unreadCount === 1 ? "" : "s"}</span> : null}
        <textarea
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message..."
          rows="3"
          value={draft}
        />
        <button className="primary-button" disabled={sending || !draft.trim()} type="submit">
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
