"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3s delay
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-slide-up-fade">
      <div className="glass rounded-2xl p-4 shadow-2xl border border-brand-700/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-slate-100 text-sm">
              Installer StudyAI
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Accède à tes cours même sans connexion.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall} className="btn-primary text-xs py-1.5 px-3">
                Installer
              </button>
              <button
                onClick={() => setVisible(false)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="btn-ghost p-1 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
