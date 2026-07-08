import { useEffect, useState } from "react";
import { verifyEmail } from "../api";
import { ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { getCurrentUser, saveAuthSession } from "../utils/auth";

function getTokenFromPath(path) {
  const query = path.split("?")[1] || "";
  return new URLSearchParams(query).get("token") || "";
}

export default function VerifyEmailPage({ path }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let mounted = true;
    const token = getTokenFromPath(path);

    if (!token) {
      setError(new Error("Verification token is missing."));
      setLoading(false);
      return;
    }

    verifyEmail(token)
      .then((data) => {
        if (!mounted) {
          return;
        }

        const currentUser = getCurrentUser();
        if (currentUser?.id === data.user.id) {
          saveAuthSession({
            token: localStorage.getItem("token"),
            user: data.user
          });
        }
        setVerified(true);
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
  }, [path]);

  if (loading) {
    return <LoadingState message="Verifying email..." />;
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Email verification</p>
        <h1>{verified ? "Email Verified" : "Verification Failed"}</h1>
        <ErrorMessage error={error} />
        {verified ? <p className="auth-copy">Your email is verified. You can now create listings or bookings.</p> : null}
        <button className="primary-button full-width" onClick={() => navigate("/account")} type="button">
          Go to Account
        </button>
      </div>
    </section>
  );
}
