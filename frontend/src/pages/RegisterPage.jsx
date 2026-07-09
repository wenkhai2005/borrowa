import { useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { registerUser, sendRegistrationVerification } from "../api";
import { ErrorMessage } from "../components/Status";
import { navigate } from "../router";
import { saveAuthSession } from "../utils/auth";

const initialForm = {
  name: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

function getDefaultCountry() {
  return "my";
}

export default function RegisterPage({ path = "" }) {
  const query = new URLSearchParams(path.split("?")[1] || "");
  const initialToken = query.get("token") || "";
  const initialEmail = query.get("email") || "";
  const [step, setStep] = useState(initialToken ? "account" : "email");
  const [email, setEmail] = useState(initialEmail);
  const [verificationToken] = useState(initialToken);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSendVerification(event) {
    event.preventDefault();
    setError(null);
    setMessage("");
    setSubmitting(true);

    try {
      const data = await sendRegistrationVerification(email);
      setEmail(data.email);
      setMessage("Verification email sent.");
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    setError(null);
    setMessage("");
    setSubmitting(true);

    try {
      const session = await registerUser({
        name: form.name,
        email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        verificationToken
      });
      saveAuthSession(session);
      navigate("/account");
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="onboarding-page">
      <div className="onboarding-brand-panel">
        <div className="onboarding-logo-row">
          <img alt="" src="/borrowa-logo.svg" />
          <strong>Borrowa</strong>
        </div>
        <div>
          <p className="pill">✓ Trusted by thousands</p>
          <h1>Borrow smarter.<span>Own less.</span></h1>
          <p>Join Borrowa to access trusted rentals from real people.</p>
        </div>
        <div className="onboarding-illustration" aria-hidden="true">
          <span>📷</span>
          <span>🎒</span>
          <span>🎧</span>
        </div>
        <div className="trust-list">
          <div><span>🛡️</span><strong>Verified users</strong><p>Verified users and secure transactions.</p></div>
          <div><span>🔒</span><strong>Secure platform</strong><p>We never share your personal information.</p></div>
          <div><span>👥</span><strong>Community driven</strong><p>Real people. Real reviews. Real trust.</p></div>
        </div>
      </div>

      <div className="onboarding-card">
        <div className="onboarding-top-link">
          <span>Already have an account?</span>
          <button onClick={() => navigate("/login")} type="button">Login</button>
        </div>

        <div className="step-indicator">
          <span className={step === "email" ? "active" : "done"}>{step === "email" ? "1" : "✓"}</span>
          <strong>Verify Email</strong>
          <i />
          <span className={step === "account" ? "active" : ""}>2</span>
          <strong>Create Account</strong>
        </div>

        {step === "email" ? (
          <>
            <h2>Let's get started</h2>
            <p className="auth-copy">Enter your email first. We'll send you a verification link.</p>
            <form onSubmit={handleSendVerification}>
              <ErrorMessage error={error} />
              {message ? (
                <div className="success-box">
                  <strong>{message}</strong>
                  <p>Check your inbox to continue.</p>
                </div>
              ) : null}
              {!message ? (
                <>
                  <label>
                    Email address
                    <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required type="email" value={email} />
                  </label>
                  <p className="helper-text">🔒 We'll never spam you.</p>
                  <button className="primary-button full-width" disabled={submitting} type="submit">
                    {submitting ? "Sending..." : "✉ Send verification link"}
                  </button>
                </>
              ) : null}
            </form>
          </>
        ) : (
          <>
            <h2>Create your account</h2>
            <p className="auth-copy">Your email is verified. Complete your Borrowa profile.</p>
            <form onSubmit={handleCreateAccount}>
              <ErrorMessage error={error} />
              <label>
                Full name
                <input autoComplete="name" name="name" onChange={updateField} required value={form.name} />
              </label>
              <label>
                Phone number
                <PhoneInput
                  defaultCountry={getDefaultCountry()}
                  forceDialCode
                  inputProps={{ autoComplete: "tel", required: true }}
                  onChange={(phone) => setForm((current) => ({ ...current, phone }))}
                  value={form.phone}
                />
                <span className="helper-text">Stored in international format, for example +60123456789.</span>
              </label>
              <div className="form-grid">
                <label>
                  Password
                  <input autoComplete="new-password" minLength="8" name="password" onChange={updateField} placeholder="Password123!" required type="password" value={form.password} />
                </label>
                <label>
                  Confirm password
                  <input autoComplete="new-password" minLength="8" name="confirmPassword" onChange={updateField} required type="password" value={form.confirmPassword} />
                </label>
              </div>
              <button className="primary-button full-width" disabled={submitting} type="submit">
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
