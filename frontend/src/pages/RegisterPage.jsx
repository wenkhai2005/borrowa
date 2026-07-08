import { useState } from "react";
import { registerUser } from "../api";
import { ErrorMessage } from "../components/Status";
import { navigate } from "../router";
import { saveAuthSession } from "../utils/auth";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  location: "Kuala Lumpur",
  password: "",
  role: "RENTER"
};

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const session = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
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
    <section className="auth-page">
      <div className="auth-card wide">
        <p className="eyebrow">Join the marketplace</p>
        <h1>Create Account</h1>
        <p className="auth-copy">Register to manage bookings and list camera gear later.</p>

        <form onSubmit={handleSubmit}>
          <ErrorMessage error={error} />

          <label>
            Full name
            <input autoComplete="name" name="name" onChange={updateField} required value={form.name} />
          </label>

          <div className="form-grid">
            <label>
              Email address
              <input autoComplete="email" name="email" onChange={updateField} required type="email" value={form.email} />
            </label>

            <label>
              Phone number
              <input autoComplete="tel" name="phone" onChange={updateField} placeholder="+60..." value={form.phone} />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Account type
              <select name="role" onChange={updateField} value={form.role}>
                <option value="RENTER">Renter</option>
                <option value="SELLER">Seller</option>
              </select>
            </label>

            <label>
              Password
              <input
                autoComplete="new-password"
                minLength="8"
                name="password"
                onChange={updateField}
                placeholder="Password123!"
                required
                type="password"
                value={form.password}
              />
            </label>
          </div>

          <button className="primary-button full-width" disabled={submitting} type="submit">
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered?{" "}
          <button onClick={() => navigate("/login")} type="button">
            Login
          </button>
        </p>
      </div>
    </section>
  );
}
