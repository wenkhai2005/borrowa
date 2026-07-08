import { navigate } from "../router";

export default function NotFoundPage() {
  return (
    <section className="status-panel">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <button className="primary-button" onClick={() => navigate("/")} type="button">
        Back to Listings
      </button>
    </section>
  );
}
