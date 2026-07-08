import { useEffect, useState } from "react";
import { getSellerDamageReports } from "../api";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";
import { navigate } from "../router";
import { formatDate, formatMoney } from "../utils/format";

function getImageUrls(report) {
  return Array.isArray(report.imageUrls) ? report.imageUrls : [];
}

export default function SellerDamageReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    getSellerDamageReports()
      .then((data) => {
        if (mounted) {
          setReports(data);
        }
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
  }, []);

  if (loading) {
    return <LoadingState message="Loading damage reports..." />;
  }

  return (
    <section className="seller-requests-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Seller disputes</p>
          <h1>Damage Reports</h1>
          <p className="helper-text">Review damage reports submitted for your bookings.</p>
        </div>
        <button className="secondary-button" onClick={() => navigate("/seller/requests")} type="button">
          Booking Requests
        </button>
      </div>

      <ErrorMessage error={error} />

      {reports.length === 0 && !error ? (
        <EmptyState title="No damage reports" message="Damage reports for your listings will appear here." />
      ) : (
        <div className="seller-request-list">
          {reports.map((report) => (
            <article className="seller-request-card" key={report.id}>
              <div className="seller-request-top">
                <div className="seller-request-image">
                  {report.booking?.listing?.imageUrl ? (
                    <img alt={report.booking.listing.title} src={report.booking.listing.imageUrl} />
                  ) : (
                    <span>{report.booking?.listing?.cameraBrand || "Gear"}</span>
                  )}
                </div>
                <div>
                  <span className="booking-status cancelled">{report.status}</span>
                  <h2>{report.title}</h2>
                  <p className="meta">{report.booking?.listing?.title || "Listing unavailable"}</p>
                </div>
              </div>

              <dl className="request-facts">
                <div>
                  <dt>Renter</dt>
                  <dd>{report.booking?.renterName || "Renter"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{report.renterEmail}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(report.createdAt)}</dd>
                </div>
                <div>
                  <dt>Claim</dt>
                  <dd>{report.claimAmount ? formatMoney(report.claimAmount) : "No amount"}</dd>
                </div>
              </dl>

              <div className="refund-reason-box">
                <strong>Description</strong>
                <p>{report.description}</p>
              </div>

              {getImageUrls(report).length > 0 ? (
                <div className="damage-image-list">
                  {getImageUrls(report).map((url) => (
                    <a href={url} key={url} rel="noreferrer" target="_blank">
                      <img alt="Damage evidence" src={url} />
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
