import Layout from "./components/Layout";
import AccountPage from "./pages/AccountPage";
import BookingChatPage from "./pages/BookingChatPage";
import CreateListingPage from "./pages/CreateListingPage";
import HomePage from "./pages/HomePage";
import ListingDetailPage from "./pages/ListingDetailPage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import MyDamageReportsPage from "./pages/MyDamageReportsPage";
import MyListingsPage from "./pages/MyListingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import SellerAvailabilityPage from "./pages/SellerAvailabilityPage";
import SellerBookingDetailPage from "./pages/SellerBookingDetailPage";
import SellerDamageReportsPage from "./pages/SellerDamageReportsPage";
import SellerEarningsPage from "./pages/SellerEarningsPage";
import SellerRefundRequestsPage from "./pages/SellerRefundRequestsPage";
import SellerRequestsPage from "./pages/SellerRequestsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { useHashRoute } from "./router";
import { getCurrentUser, isLoggedIn } from "./utils/auth";

function UnauthorizedPage({ message = "You do not have access to this page." }) {
  return (
    <section className="status-panel">
      <h1>Unauthorized</h1>
      <p>{message}</p>
    </section>
  );
}

function requireLogin(page) {
  return isLoggedIn() ? page : <LoginPage />;
}

function requireRole(role, page) {
  if (!isLoggedIn()) {
    return <LoginPage />;
  }

  const user = getCurrentUser();

  if (user?.role !== role) {
    return <UnauthorizedPage message={`This page requires a ${role.toLowerCase()} account.`} />;
  }

  return page;
}

function getRoute(path) {
  if (path === "/") {
    return <HomePage />;
  }

  if (path === "/explore" || path === "/marketplace") {
    return <ListingsPage />;
  }

  if (path === "/listings/new") {
    return requireRole("SELLER", <CreateListingPage />);
  }

  if (path === "/bookings") {
    return requireRole("RENTER", <MyBookingsPage />);
  }

  const renterBookingChatMatch = path.match(/^\/bookings\/([^/]+)\/chat$/);
  if (renterBookingChatMatch) {
    return requireRole("RENTER", <BookingChatPage bookingId={renterBookingChatMatch[1]} />);
  }

  if (path === "/my-listings" || path === "/seller/listings") {
    return requireRole("SELLER", <MyListingsPage />);
  }

  if (path === "/seller/requests") {
    return requireRole("SELLER", <SellerRequestsPage />);
  }

  if (path === "/seller/refund-requests") {
    return requireRole("SELLER", <SellerRefundRequestsPage />);
  }

  if (path === "/seller/damage-reports") {
    return requireRole("SELLER", <SellerDamageReportsPage />);
  }

  if (path === "/seller/earnings") {
    return requireRole("SELLER", <SellerEarningsPage />);
  }

  const sellerBookingMatch = path.match(/^\/seller\/bookings\/([^/]+)$/);
  if (sellerBookingMatch) {
    return requireRole("SELLER", <SellerBookingDetailPage bookingId={sellerBookingMatch[1]} />);
  }

  const sellerAvailabilityMatch = path.match(/^\/seller\/listings\/([^/]+)\/availability$/);
  if (sellerAvailabilityMatch) {
    return requireRole("SELLER", <SellerAvailabilityPage listingId={sellerAvailabilityMatch[1]} />);
  }

  if (path === "/login") {
    return <LoginPage />;
  }

  if (path === "/register" || path.startsWith("/register?")) {
    return <RegisterPage path={path} />;
  }

  if (path.startsWith("/verify-email")) {
    return <VerifyEmailPage path={path} />;
  }

  if (path === "/account") {
    return requireLogin(<AccountPage />);
  }

  if (path === "/my-damage-reports") {
    return requireRole("RENTER", <MyDamageReportsPage />);
  }

  const listingMatch = path.match(/^\/listings\/([^/]+)$/);
  if (listingMatch) {
    return <ListingDetailPage listingId={listingMatch[1]} />;
  }

  return <NotFoundPage />;
}

export default function App() {
  const path = useHashRoute();

  return (
    <Layout currentPath={path}>
      {getRoute(path)}
    </Layout>
  );
}
