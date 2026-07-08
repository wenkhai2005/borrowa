function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function ChatPreview({ summary }) {
  const latestMessage = summary?.latestMessage;
  const unreadCount = summary?.unreadMessageCount || 0;

  if (!latestMessage) {
    return (
      <div className="chat-preview muted">
        <span>No messages yet.</span>
      </div>
    );
  }

  return (
    <div className="chat-preview">
      <div>
        <strong>{latestMessage.isMine ? "You" : latestMessage.senderName}</strong>
        <span>{latestMessage.message}</span>
      </div>
      <div className="chat-preview-meta">
        {unreadCount > 0 ? <span className="unread-badge">{unreadCount}</span> : null}
        <time>{formatMessageTime(latestMessage.createdAt)}</time>
      </div>
    </div>
  );
}
