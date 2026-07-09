import { useEffect, useState } from "react";
import { getListings } from "../api";
import { navigate } from "../router";
import { formatMoney } from "../utils/format";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";

const categories = ["Camera", "Lense", "Action Camera", "Accessories", "Others"];

const defaultFilters = {
  categories: [],
  brand: "",
  location: "",
  maxPrice: 250,
  deliveryOnly: false,
  sortBy: "newest"
};

function inferCategory(listing) {
  const text = `${listing.title || ""} ${listing.cameraBrand || ""} ${listing.cameraModel || ""}`.toLowerCase();

  if (text.includes("lens") || text.includes("mm") || text.includes("rf ") || text.includes("fe ")) {
    return "Lens";
  }

  if (text.includes("action") || text.includes("gopro")) {
    return "Action Camera";
  }

  if (text.includes("drone") || text.includes("dji") || text.includes("mavic")) {
    return "Drone";
  }

  if (text.includes("light") || text.includes("godox")) {
    return "Lighting";
  }

  if (text.includes("rode") || text.includes("audio") || text.includes("mic")) {
    return "Audio";
  }

  return "Camera";
}

function getFilterCategory(category) {
  if (category === "Camera") {
    return "Camera";
  }

  if (category === "Lens" || category === "Lense") {
    return "Lense";
  }

  if (category === "Action Camera") {
    return "Action Camera";
  }

  if (category === "Accessories") {
    return "Accessories";
  }

  return "Others";
}

function displayPrice(value) {
  return formatMoney(value).replace(".00", "");
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "BR";
}

function normalizeListing(listing) {
  const hasSellerRating = listing.sellerAverageRating !== null && listing.sellerAverageRating !== undefined;
  const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];

  return {
    ...listing,
    category: listing.category || inferCategory(listing),
    imageUrl: imageUrls[0] || listing.imageUrl || "",
    rating: hasSellerRating ? Number(listing.sellerAverageRating).toFixed(1) : null,
    reviews: hasSellerRating ? listing.sellerReviewCount || 0 : 0,
    ownerName: listing.ownerName || "Borrowa host",
    ownerInitials: listing.ownerInitials || getInitials(listing.ownerName),
    deposit: listing.deposit || 0,
    deliveryAvailable: listing.deliveryAvailable ?? false,
    verified: listing.verified ?? true
  };
}

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    let mounted = true;

    getListings()
      .then((data) => {
        if (mounted) {
          setListings(data);
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
    return <LoadingState message="Loading camera listings..." />;
  }

  const allListings = error ? [] : listings.map(normalizeListing);
  const brands = [...new Set(allListings.map((listing) => listing.cameraBrand))].sort();
  const locations = [...new Set(allListings.map((listing) => listing.location))].sort();
  const categoryCounts = categories.reduce((counts, category) => {
    counts[category] = allListings.filter((listing) => getFilterCategory(listing.category) === category).length;
    return counts;
  }, {});

  const visibleListings = allListings
    .filter((listing) => {
      const category = getFilterCategory(listing.category);
      const searchText = `${listing.title} ${listing.category} ${category} ${listing.cameraBrand} ${listing.cameraModel} ${listing.location} ${listing.ownerName}`.toLowerCase();

      if (!searchText.includes(query.trim().toLowerCase())) {
        return false;
      }

      if (filters.categories.length > 0 && !filters.categories.includes(category)) {
        return false;
      }

      if (filters.brand && listing.cameraBrand !== filters.brand) {
        return false;
      }

      if (filters.location && listing.location !== filters.location) {
        return false;
      }

      if (Number(listing.dailyRate) > Number(filters.maxPrice)) {
        return false;
      }

      if (filters.deliveryOnly && !listing.deliveryAvailable) {
        return false;
      }

      return true;
    })
    .sort((first, second) => {
      if (filters.sortBy === "price-low") {
        return Number(first.dailyRate) - Number(second.dailyRate);
      }

      if (filters.sortBy === "price-high") {
        return Number(second.dailyRate) - Number(first.dailyRate);
      }

      return 0;
    });

  function toggleCategory(category) {
    setFilters((current) => {
      const selected = current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category];

      return {
        ...current,
        categories: selected
      };
    });
  }

  function setSingleCategory(category) {
    setFilters((current) => ({
      ...current,
      categories: category ? [category] : []
    }));
  }

  function resetFilters() {
    setQuery("");
    setFilters(defaultFilters);
  }

  return (
    <section className="marketplace-page">
      {error ? (
        <ErrorMessage error={error} />
      ) : null}

      {!error && listings.length === 0 ? (
        <div className="demo-notice">
          No listings yet. Real listings from the database will appear here once hosts add items.
        </div>
      ) : null}

      <div className="marketplace-layout">
        <aside className="filter-card" aria-label="Listing filters">
          <div className="filter-card-header">
            <h2>Filters</h2>
            <button className="text-reset" onClick={resetFilters} type="button">Reset</button>
          </div>

          <div className="filter-group">
            <h3>Category</h3>
            {categories.map((category, index) => (
              <label className="filter-checkbox" key={category}>
                <span>
                  <input
                    checked={filters.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    type="checkbox"
                  />
                  {category}
                </span>
                <em>{categoryCounts[category]}</em>
              </label>
            ))}
          </div>

          <label className="filter-group">
            <span className="filter-label">Brand</span>
            <select
              onChange={(event) => setFilters((current) => ({ ...current, brand: event.target.value }))}
              value={filters.brand}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand}>{brand}</option>
              ))}
            </select>
          </label>

          <div className="filter-group">
            <h3>Price Range (per day)</h3>
            <input
              aria-label="Price range"
              className="price-range"
              max="250"
              min="20"
              onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))}
              step="5"
              type="range"
              value={filters.maxPrice}
            />
            <div className="range-labels">
              <span>RM 20</span>
              <span>Up to RM {filters.maxPrice}</span>
            </div>
          </div>

          <label className="filter-group">
            <span className="filter-label">Location</span>
            <select
              onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
              value={filters.location}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
          </label>

          <div className="filter-group">
            <h3>Delivery</h3>
            <label className="filter-checkbox">
              <span>
                <input
                  checked={filters.deliveryOnly}
                  onChange={(event) => setFilters((current) => ({ ...current, deliveryOnly: event.target.checked }))}
                  type="checkbox"
                />
                Available for delivery only
              </span>
            </label>
          </div>
        </aside>

        <div className="listings-panel">
          <div className="listing-controls">
            <label className="control-search">
              <span aria-hidden="true">⌕</span>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cameras, lenses, gear..."
                type="search"
                value={query}
              />
            </label>
            <select
              aria-label="Category"
              onChange={(event) => setSingleCategory(event.target.value)}
              value={filters.categories.length === 1 ? filters.categories[0] : ""}
            >
              <option value="">Category</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select
              aria-label="Location"
              onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
              value={filters.location}
            >
              <option value="">Location</option>
              {locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
            <select
              aria-label="Sort listings"
              onChange={(event) => setFilters((current) => ({ ...current, sortBy: event.target.value }))}
              value={filters.sortBy}
            >
              <option value="newest">Sort by: Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <div className="view-toggle" aria-label="View mode">
              <button
                aria-pressed={viewMode === "grid"}
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                type="button"
              >
                ▦
              </button>
              <button
                aria-pressed={viewMode === "list"}
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                type="button"
              >
                ☷
              </button>
            </div>
          </div>

          {visibleListings.length === 0 ? (
            <EmptyState title="No matching listings" message="Try a different search term or reset your filters." />
          ) : (
            <div className={viewMode === "grid" ? "listing-grid marketplace-grid" : "listing-grid marketplace-grid list-view"}>
              {visibleListings.map((listing) => (
                <article className="listing-card marketplace-card" key={listing.id}>
                  <button aria-label={`Save ${listing.title}`} className="wishlist-button" type="button">
                    ♡
                  </button>
                  <button className="listing-card-link" onClick={() => navigate(`/listings/${listing.id}`)} type="button">
                    <div className="listing-image">
                      {listing.imageUrl ? <img alt={listing.title} src={listing.imageUrl} /> : <span>{listing.cameraBrand || "Item"}</span>}
                    </div>
                    <div className="listing-card-body">
                      <div>
                        <h2>{listing.title}</h2>
                        <p className="category-text">{listing.category}</p>
                      </div>
                      <div className="listing-meta-row">
                        {listing.rating ? (
                          <span className="rating">★ {listing.rating} <small>({listing.reviews})</small></span>
                        ) : (
                          <span className="rating muted">No reviews yet</span>
                        )}
                        <strong>{displayPrice(listing.dailyRate)} <small>/ day</small></strong>
                      </div>
                      <p className="deposit-text">Deposit {displayPrice(listing.deposit)}</p>
                      <p className="location-text">⌖ {listing.location}</p>
                      <div className="owner-row">
                        <span className="owner-avatar">{listing.ownerInitials}</span>
                        <span>{listing.ownerName}</span>
                        {listing.verified ? <em>✓ Verified</em> : null}
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
