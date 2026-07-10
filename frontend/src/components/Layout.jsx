import { useEffect, useState } from "react";
import { navigate } from "../router";
import { getCurrentUser, isLoggedIn, logout } from "../utils/auth";

function isActive(currentPath, targetPath) {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(targetPath);
}

function NavLink({ currentPath, onNavigate, path, children }) {
  return (
    <button
      className={isActive(currentPath, path) ? "nav-link active" : "nav-link"}
      onClick={() => {
        onNavigate?.();
        navigate(path);
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function scrollToHowItWorks() {
  if (window.location.hash !== "#/") {
    navigate("/");
    window.setTimeout(() => {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
    return;
  }

  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
}

function getStoredAccount() {
  return getCurrentUser();
}

function getInitials(account) {
  if (!account?.name) {
    return "WK";
  }

  return account.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Layout({ currentPath, children }) {
  const [account, setAccount] = useState(() => getStoredAccount());
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setAccount(getStoredAccount());
    setLoggedIn(isLoggedIn());
    setMenuOpen(false);
    setMobileNavOpen(false);
  }, [currentPath]);

  function goTo(path) {
    setMenuOpen(false);
    setMobileNavOpen(false);
    navigate(path);
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setMenuOpen(false);
    setMobileNavOpen(false);
    navigate("/login");
  }

  function handleBecomeHost() {
    setMobileNavOpen(false);

    if (loggedIn && account?.role === "SELLER") {
      navigate("/listings/new");
      return;
    }

    if (loggedIn) {
      navigate("/account");
      return;
    }

    navigate("/register");
  }

  function handleHowItWorks() {
    setMobileNavOpen(false);
    scrollToHowItWorks();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate("/")} type="button">
          <img alt="" className="brand-icon" src="/borrowa-logo.svg" />
          <span>Borrowa</span>
        </button>
        <button
          aria-expanded={mobileNavOpen}
          aria-label="Toggle navigation menu"
          className="mobile-menu-button"
          onClick={() => {
            setMobileNavOpen((open) => !open);
            setMenuOpen(false);
          }}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={mobileNavOpen ? "site-nav mobile-open" : "site-nav"} aria-label="Primary navigation">
          <NavLink currentPath={currentPath} onNavigate={() => setMobileNavOpen(false)} path="/explore">
            Explore
          </NavLink>
          <button className="nav-link" onClick={handleHowItWorks} type="button">
            How it works
          </button>
          <button className="nav-link" onClick={handleBecomeHost} type="button">
            {loggedIn && account?.role === "SELLER" ? "Add listing" : "Become a host"}
          </button>
          <div className="profile-menu">
            <button
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="avatar-button"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <span className="avatar-image">{getInitials(account)}</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {menuOpen ? (
              <div className="profile-dropdown" role="menu">
                {loggedIn && account ? (
                  <div className="profile-summary">
                    <strong>{account.name}</strong>
                    <span>{account.role} · {account.email}</span>
                  </div>
                ) : null}
                {loggedIn ? (
                  <>
                    <button onClick={() => goTo("/account")} role="menuitem" type="button">
                      Account Info
                    </button>
                    {account?.role === "RENTER" ? (
                      <button onClick={() => goTo("/bookings")} role="menuitem" type="button">
                        My Bookings
                      </button>
                    ) : null}
                    {account?.role === "SELLER" ? (
                      <>
                        <button onClick={() => goTo("/my-listings")} role="menuitem" type="button">
                          Dashboard
                        </button>
                        <button onClick={() => goTo("/seller/listings")} role="menuitem" type="button">
                          My Listings
                        </button>
                        <button onClick={() => goTo("/seller/requests")} role="menuitem" type="button">
                          Booking Requests
                        </button>
                        <button onClick={() => goTo("/seller/refund-requests")} role="menuitem" type="button">
                          Refund Requests
                        </button>
                        <button onClick={() => goTo("/seller/damage-reports")} role="menuitem" type="button">
                          Damage Reports
                        </button>
                        <button onClick={() => goTo("/seller/earnings")} role="menuitem" type="button">
                          Earnings
                        </button>
                      </>
                    ) : null}
                    {account?.role === "RENTER" ? (
                      <button onClick={() => goTo("/my-damage-reports")} role="menuitem" type="button">
                        Damage Reports
                      </button>
                    ) : null}
                    <button onClick={handleLogout} role="menuitem" type="button">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => goTo("/login")} role="menuitem" type="button">
                      Login
                    </button>
                    <button onClick={() => goTo("/register")} role="menuitem" type="button">
                      Register
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </nav>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
