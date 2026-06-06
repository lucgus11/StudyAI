"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SW] Enregistré :", reg.scope);

          // Forcer la mise à jour si une nouvelle version est disponible
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  newWorker.postMessage("SKIP_WAITING");
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((err) => console.warn("[SW] Erreur d'enregistrement :", err));
    }
  }, []);

  return null;
}
