import { useEffect, useState } from "react";
import { getListings } from "../api";
import { navigate } from "../router";
import { formatMoney } from "../utils/format";
import { getCurrentUser, isLoggedIn } from "../utils/auth";

const categoryCards = [
  { title: "Camera Gear", icon: "📷" },
  { title: "Creator Gear", icon: "🎥" },
  { title: "Drones", icon: "🚁" },
  { title: "Gaming", icon: "🎮" },
  { title: "Camping", icon: "⛺" },
  { title: "Tools", icon: "🛠️" }
];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "BR";
}

function getListingImage(listing) {
  const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];
  return imageUrls[0] || listing.imageUrl || "";
}

function normalizeFeatured(listing) {
  const hasSellerRating = listing.sellerAverageRating !== null && listing.sellerAverageRating !== undefined;

  return {
    ...listing,
    imageUrl: getListingImage(listing),
    category: listing.category || "Listing",
    rating: hasSellerRating ? Number(listing.sellerAverageRating).toFixed(1) : null,
    reviews: hasSellerRating ? listing.sellerReviewCount || 0 : 0,
    ownerName: listing.ownerName || "Borrowa host",
    ownerInitials: listing.ownerInitials || getInitials(listing.ownerName),
    deposit: listing.deposit || 0
  };
}

function goToHostFlow() {
  const user = getCurrentUser();

  if (isLoggedIn() && user?.role === "SELLER") {
    navigate("/listings/new");
    return;
  }

  if (isLoggedIn()) {
    navigate("/account");
    return;
  }

  navigate("/register");
}

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const currentUser = getCurrentUser();
  const isSeller = isLoggedIn() && currentUser?.role === "SELLER";

  useEffect(() => {
    let mounted = true;

    getListings()
      .then((data) => {
        if (mounted) {
          setListings(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setListings([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const featuredListings = listings.slice(0, 4).map(normalizeFeatured);

  return (
    <section className="home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Borrowa marketplace</p>
          <h1>
            Borrow smarter.
            <span>Own less.</span>
          </h1>
          <p>Discover trusted gear and everyday items from people around you.</p>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span className="hero-object camera">📷</span>
          <span className="hero-object bag">🎒</span>
          <span className="hero-object drone">🚁</span>
        </div>

      </section>

      <section className="home-section">
        <div className="section-heading-row">
          <h2>Browse by category</h2>
          <button className="link-button" onClick={() => navigate("/explore")} type="button">
            View all categories →
          </button>
        </div>
        <div className="category-card-grid">
          {categoryCards.map((category) => (
            <button className="category-card" key={category.title} onClick={() => navigate("/explore")} type="button">
              <span>{category.icon}</span>
              <strong>{category.title}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading-row">
          <h2>Featured near you</h2>
          <button className="link-button" onClick={() => navigate("/explore")} type="button">
            View all listings →
          </button>
        </div>
        {featuredListings.length === 0 ? (
          <div className="empty-state">
            <h2>No listings yet</h2>
            <p>Real listings from the database will appear here once hosts add items.</p>
          </div>
        ) : (
          <div className="featured-grid">
            {featuredListings.map((listing) => (
            <article className="featured-card" key={listing.id}>
              <button aria-label={`Save ${listing.title}`} className="wishlist-button" type="button">
                ♡
              </button>
              <button
                className="listing-card-link"
                onClick={() => navigate(`/listings/${listing.id}`)}
                type="button"
              >
                {listing.imageUrl ? <img alt={listing.title} src={listing.imageUrl} /> : <div className="featured-image-placeholder">{listing.category}</div>}
                <div className="featured-card-body">
                  <h3>{listing.title}</h3>
                  <p>{listing.category}</p>
                  <div className="listing-meta-row">
                    {listing.rating ? (
                      <span className="rating">★ {listing.rating} <small>({listing.reviews})</small></span>
                    ) : (
                      <span className="rating muted">No reviews yet</span>
                    )}
                    <strong>{formatMoney(listing.dailyRate).replace(".00", "")} <small>/ day</small></strong>
                  </div>
                  <p className="deposit-text">Deposit {formatMoney(listing.deposit).replace(".00", "")}</p>
                  <p className="location-text">{listing.location}</p>
                  <div className="owner-row">
                    <span className="owner-avatar">{listing.ownerInitials}</span>
                    <span>{listing.ownerName}</span>
                    <em>✓ Verified</em>
                  </div>
                </div>
              </button>
            </article>
            ))}
          </div>
        )}
      </section>

      <section className="how-it-works-panel" id="how-it-works">
        <h2>How Borrowa works</h2>
        <div className="steps-grid">
          <div><span>⌕</span><strong>1. Search</strong><p>Find items near you and check availability.</p></div>
          <div><span>📅</span><strong>2. Book</strong><p>Choose your dates and send a request.</p></div>
          <div><span>🛡️</span><strong>3. Confirm</strong><p>Hosts accept and coordinate handoff.</p></div>
          <div><span>📦</span><strong>4. Return</strong><p>Use the item and return it on time.</p></div>
        </div>
      </section>

      <section className="host-banner">
        <div>
          <h2>Have something to share?</h2>
          <p>List your item and start earning from things you already own.</p>
          <button className="secondary-button" onClick={goToHostFlow} type="button">
            {isSeller ? "Add listing" : "Become a host"}
          </button>
        </div>
        <div className="host-banner-art" aria-hidden="true">📷 💻 🧰 🛴</div>
      </section>
    </section>
  );
}
