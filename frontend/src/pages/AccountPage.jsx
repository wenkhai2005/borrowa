import { useState } from "react";
import { getMe, resendVerificationEmail } from "../api";
import { navigate } from "../router";
import { formatDate } from "../utils/format";
import { getCurrentUser, isLoggedIn, logout, saveAuthSession } from "../utils/auth";

function getAccount() {
  return getCurrentUser();
}

export default function AccountPage() {
  const [account, setAccount] = useState(() => getAccount());
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const loggedIn = isLoggedIn();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleResendVerification() {
    setSending(true);
    setMessage("");
    setError(null);

    try {
      await resendVerificationEmail();
      const data = await getMe();
      saveAuthSession({ user: data.user });
      setAccount(data.user);
      setMessage("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  if (!account || !loggedIn) {
    return (
      <section className="account-empty">
        <div className="auth-card">
          <p className="eyebrow">Account</p>
          <h1>Login required</h1>
          <p className="auth-copy">Login or create an account to view your profile information.</p>
          <div className="button-row">
            <button className="secondary-button" onClick={() => navigate("/register")} type="button">
              Register
            </button>
            <button className="primary-button" onClick={() => navigate("/login")} type="button">
              Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  const initials = account.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="account-page">
      <div className="account-hero">
        <div className="account-avatar">{initials}</div>
        <div>
          <p className="eyebrow">Account Info</p>
          <h1>{account.name}</h1>
          <p>{account.email}</p>
        </div>
        <button className="secondary-button" onClick={handleLogout} type="button">
          Logout
        </button>
      </div>

      <div className="account-grid">
        <article className="account-card">
          <h2>Profile Details</h2>
          <dl className="account-details">
            <div>
              <dt>Name</dt>
              <dd>{account.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{account.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{account.role}</dd>
            </div>
            <div>
              <dt>Email verification</dt>
              <dd>{account.emailVerifiedAt ? `Verified on ${formatDate(account.emailVerifiedAt)}` : "Not verified"}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{account.id}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{formatDate(new Date())}</dd>
            </div>
          </dl>
        </article>

        {!account.emailVerifiedAt ? (
          <article className="account-card">
            <h2>Verify Email</h2>
            <p className="auth-copy">Verify your email before creating listings or bookings.</p>
            {error ? (
              <div className="error-box" role="alert">
                <strong>{error.message}</strong>
              </div>
            ) : null}
            {message ? <div className="success-box">{message}</div> : null}
            <button className="primary-button full-width" disabled={sending} onClick={handleResendVerification} type="button">
              {sending ? "Sending..." : "Resend verification email"}
            </button>
          </article>
        ) : null}

        <article className="account-card">
          <h2>Marketplace Summary</h2>
          <div className="account-stats">
            <div>
              <strong>0</strong>
              <span>Active listings</span>
            </div>
            <div>
              <strong>0</strong>
              <span>Upcoming bookings</span>
            </div>
            <div>
              <strong>Verified</strong>
              <span>Account role</span>
            </div>
          </div>
          <button
            className="primary-button full-width"
            onClick={() => navigate(account.role === "SELLER" ? "/my-listings" : "/bookings")}
            type="button"
          >
            {account.role === "SELLER" ? "View Seller Dashboard" : "View My Bookings"}
          </button>
        </article>
      </div>
    </section>
  );
}
