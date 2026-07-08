import { useEffect, useState } from "react";

export function getCurrentPath() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export function navigate(path) {
  window.location.hash = path;
}

export function useHashRoute() {
  const [path, setPath] = useState(getCurrentPath());

  useEffect(() => {
    const handleHashChange = () => setPath(getCurrentPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return path;
}
