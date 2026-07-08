export function LoadingState({ message = "Loading..." }) {
  return <div className="status-panel">{message}</div>;
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="status-panel">
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function ErrorMessage({ error }) {
  if (!error) {
    return null;
  }

  const isBookingConflict = error.message?.toLowerCase().includes("booking conflict") ||
    error.message?.toLowerCase().includes("booked") ||
    error.message?.toLowerCase().includes("dates");

  const friendlyMessages = {
    401: "Please log in to continue.",
    403: error.message?.toLowerCase().includes("verify your email")
      ? error.message
      : "You do not have permission to perform this action.",
    404: "We could not find that record. It may have been removed.",
    409: isBookingConflict ? "These dates are no longer available. Please refresh and try again." : error.message
  };

  const message = friendlyMessages[error.status] || error.message;

  return (
    <div className="error-box" role="alert">
      <strong>{message}</strong>
      {error.details ? (
        <ul>
          {Object.entries(error.details).map(([field, message]) => (
            <li key={field}>
              {field}: {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
