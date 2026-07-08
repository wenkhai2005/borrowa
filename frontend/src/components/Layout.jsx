import { useEffect, useState } from "react";
import { navigate } from "../router";
import { getCurrentUser, isLoggedIn, logout } from "../utils/auth";

function CameraIcon() {
  return (
    <svg aria-hidden="true" className="brand-icon" fill="none" viewBox="0 0 24 24">
      <path
        d="M7.5 7 9 4.8h6L16.5 7H19a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 16a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function isActive(currentPath, targetPath) {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(targetPath);
}

function NavLink({ currentPath, path, children }) {
  return (
    <button
      className={isActive(currentPath, path) ? "nav-link active" : "nav-link"}
      onClick={() => navigate(path)}
      type="button"
    >
      {children}
    </button>
  );
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

  useEffect(() => {
    setAccount(getStoredAccount());
    setLoggedIn(isLoggedIn());
    setMenuOpen(false);
  }, [currentPath]);

  function goTo(path) {
    setMenuOpen(false);
    navigate(path);
  }

  function handleLogout() {
    logout();
    setLoggedIn(false);
    setMenuOpen(false);
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate("/")} type="button">
          <CameraIcon />
          <span>Camera Rental</span>
        </button>
        <nav className="site-nav" aria-label="Primary navigation">
          <NavLink currentPath={currentPath} path="/">
            Listings
          </NavLink>
          {loggedIn && account?.role === "SELLER" ? (
            <NavLink currentPath={currentPath} path="/my-listings">
              Dashboard
            </NavLink>
          ) : null}
          {loggedIn && account?.role === "RENTER" ? (
            <>
              <NavLink currentPath={currentPath} path="/bookings">
                My Bookings
              </NavLink>
              <NavLink currentPath={currentPath} path="/my-damage-reports">
                Damage Reports
              </NavLink>
            </>
          ) : null}
          {!loggedIn ? (
            <>
              <NavLink currentPath={currentPath} path="/login">
                Login
              </NavLink>
              <NavLink currentPath={currentPath} path="/register">
                Register
              </NavLink>
            </>
          ) : null}
          <button aria-label="Notifications" className="icon-button" type="button">
            <span aria-hidden="true">♢</span>
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
