import { useEffect, useState } from "react";
import { getListings } from "../api";
import { navigate } from "../router";
import { formatMoney } from "../utils/format";
import { EmptyState, ErrorMessage, LoadingState } from "../components/Status";

const categories = ["Camera", "Lense", "Action Camera", "Accessories", "Others"];

const sampleListings = [
  {
    id: "sample-sony-a7-iv",
    title: "Sony A7 IV",
    cameraBrand: "Sony",
    cameraModel: "A7 IV",
    category: "Camera",
    deposit: 1000,
    location: "Petaling Jaya",
    dailyRate: 120,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    rating: "4.9",
    reviews: 18,
    ownerName: "Jason Tan",
    ownerInitials: "JT",
    deliveryAvailable: true,
    verified: true
  },
  {
    id: "sample-canon-r6",
    title: "Canon EOS R6 Mark II",
    cameraBrand: "Canon",
    cameraModel: "R6 Mark II",
    category: "Camera",
    deposit: 1000,
    location: "Kuala Lumpur",
    dailyRate: 110,
    imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
    rating: "4.8",
    reviews: 16,
    ownerName: "Sarah Lim",
    ownerInitials: "SL",
    deliveryAvailable: true,
    verified: true
  },
  {
    id: "sample-sony-lens",
    title: "Sony FE 24-70mm f/2.8 GM II",
    cameraBrand: "Sony",
    cameraModel: "24-70 GM II",
    category: "Lens",
    deposit: 800,
    location: "Shah Alam",
    dailyRate: 80,
    imageUrl: "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=900&q=80",
    rating: "5.0",
    reviews: 21,
    ownerName: "Ahmad Rahman",
    ownerInitials: "AR",
    deliveryAvailable: false,
    verified: true
  },
  {
    id: "sample-canon-rf-70-200",
    title: "Canon RF 70-200mm f/2.8",
    cameraBrand: "Canon",
    cameraModel: "RF 70-200",
    category: "Lens",
    deposit: 900,
    location: "Subang Jaya",
    dailyRate: 95,
    imageUrl: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=900&q=80",
    rating: "4.9",
    reviews: 14,
    ownerName: "Daniel Lee",
    ownerInitials: "DL",
    deliveryAvailable: true,
    verified: true
  },
  {
    id: "sample-dji-air-3",
    title: "DJI Air 3",
    cameraBrand: "DJI",
    cameraModel: "Air 3",
    category: "Drone",
    deposit: 1500,
    location: "Puchong",
    dailyRate: 180,
    imageUrl: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=80",
    rating: "4.9",
    reviews: 19,
    ownerName: "Kevin Wong",
    ownerInitials: "KW",
    deliveryAvailable: false,
    verified: true
  },
  {
    id: "sample-dji-action-4",
    title: "DJI Action 4",
    cameraBrand: "DJI",
    cameraModel: "Action 4",
    category: "Action Camera",
    deposit: 400,
    location: "Kuala Lumpur",
    dailyRate: 45,
    imageUrl: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=900&q=80",
    rating: "4.8",
    reviews: 11,
    ownerName: "Melissa Ng",
    ownerInitials: "MN",
    deliveryAvailable: true,
    verified: true
  },
  {
    id: "sample-gopro-hero-13",
    title: "GoPro Hero 13 Black",
    cameraBrand: "GoPro",
    cameraModel: "Hero 13",
    category: "Action Camera",
    deposit: 450,
    location: "Cheras",
    dailyRate: 50,
    imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80",
    rating: "4.8",
    reviews: 13,
    ownerName: "Marcus Tan",
    ownerInitials: "MT",
    deliveryAvailable: true,
    verified: true
  },
  {
    id: "sample-godox",
    title: "Godox SL60W",
    cameraBrand: "Godox",
    cameraModel: "SL60W",
    category: "Lighting",
    deposit: 250,
    location: "Cyberjaya",
    dailyRate: 30,
    imageUrl: "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=900&q=80",
    rating: "4.7",
    reviews: 9,
    ownerName: "Jason Ho",
    ownerInitials: "JH",
    deliveryAvailable: false,
    verified: true
  },
  {
    id: "sample-rode",
    title: "Rode Wireless GO II",
    cameraBrand: "Rode",
    cameraModel: "Wireless GO II",
    category: "Audio",
    deposit: 300,
    location: "Petaling Jaya",
    dailyRate: 35,
    imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
    rating: "5.0",
    reviews: 17,
    ownerName: "Siti Aminah",
    ownerInitials: "SA",
    deliveryAvailable: true,
    verified: true
  },
  {
    id: "sample-sigma-18-50",
    title: "Sigma 18-50mm f/2.8 DC DN",
    cameraBrand: "Sigma",
    cameraModel: "18-50mm",
    category: "Lens",
    deposit: 350,
    location: "Klang",
    dailyRate: 40,
    imageUrl: "https://images.unsplash.com/photo-1519183071298-a2962eadc3bb?auto=format&fit=crop&w=900&q=80",
    rating: "4.8",
    reviews: 12,
    ownerName: "Nicholas Yap",
    ownerInitials: "NY",
    deliveryAvailable: false,
    verified: true
  }
];

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

function normalizeListing(listing, index) {
  const fallback = sampleListings[index % sampleListings.length];
  const hasSellerRating = listing.sellerAverageRating !== null && listing.sellerAverageRating !== undefined;

  return {
    ...fallback,
    ...listing,
    category: listing.category || inferCategory(listing),
    imageUrl: listing.imageUrl || fallback.imageUrl,
    rating: hasSellerRating ? Number(listing.sellerAverageRating).toFixed(1) : null,
    reviews: hasSellerRating ? listing.sellerReviewCount || 0 : 0,
    ownerName: listing.ownerName || fallback.ownerName,
    ownerInitials: listing.ownerInitials || fallback.ownerInitials,
    deposit: listing.deposit || fallback.deposit,
    deliveryAvailable: listing.deliveryAvailable ?? fallback.deliveryAvailable,
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

  const usingSampleListings = error || listings.length === 0;
  const allListings = usingSampleListings ? sampleListings : listings.map(normalizeListing);
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
        <div className="demo-notice">
          Backend listings could not be loaded, so sample marketplace cards are shown for preview.
        </div>
      ) : null}

      {!error && listings.length === 0 ? (
        <div className="demo-notice">
          No backend listings yet. Sample listings are shown so the marketplace UI can be previewed.
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
                      <img alt={listing.title} src={listing.imageUrl} />
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
