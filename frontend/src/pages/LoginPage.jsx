import { useState } from "react";
import { loginUser } from "../api";
import { ErrorMessage } from "../components/Status";
import { navigate } from "../router";
import { saveAuthSession } from "../utils/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const session = await loginUser({ email, password });
      saveAuthSession(session);
      setPassword("");
      navigate("/account");
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login</h1>
        <p className="auth-copy">Access your bookings and account details.</p>

        <form onSubmit={handleSubmit}>
          <ErrorMessage error={error} />

          <label>
            Email address
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              minLength="6"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button className="primary-button full-width" disabled={submitting} type="submit">
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          New to Camera Rental?{" "}
          <button onClick={() => navigate("/register")} type="button">
            Create an account
          </button>
        </p>
      </div>
    </section>
  );
}
