export function getToken() {
  return localStorage.getItem("token") || "";
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user") || "null");
}

export function isLoggedIn() {
  return Boolean(getToken() && getCurrentUser());
}

export function saveAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem("token", token);
  }
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.removeItem("renterEmail");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("renterEmail");
  localStorage.removeItem("cameraRentalAccount");
}
