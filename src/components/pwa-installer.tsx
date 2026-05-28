"use client";

import { useEffect } from "react";

export function PwaInstaller() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const secureContext = window.location.protocol === "https:" || localHost;
    if (!secureContext) return;

    const registerServiceWorker = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
      return;
    }

    window.addEventListener("load", registerServiceWorker, { once: true });
    return () => window.removeEventListener("load", registerServiceWorker);
  }, []);

  return null;
}
