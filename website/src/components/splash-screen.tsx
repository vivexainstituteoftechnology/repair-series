"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    try {
      const hasSeenSplash = sessionStorage.getItem("rs_splash_shown");
      if (hasSeenSplash) {
        setVisible(false);
        return;
      }
    } catch {
      // sessionStorage might not be accessible in private browsing
    }

    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 650);

    const timer2 = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem("rs_splash_shown", "1");
      } catch {
        // ignore
      }
    }, 950);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      try {
        const s = document.getElementById("rs-splash-css");
        if (s) s.remove();
      } catch {
        // ignore
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="rs-splash-screen"
      suppressHydrationWarning
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ease-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Animated Brand Logo Icon */}
        <div className="relative size-20 sm:size-24 mb-3 transition-transform duration-500 scale-100 animate-in zoom-in-95">
          <Image
            src="/logo.png"
            alt="RepairSeries"
            width={96}
            height={96}
            priority
            className="h-full w-full object-contain drop-shadow-sm"
          />
        </div>

        {/* Brand Name */}
        <div className="flex items-center gap-1">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
            Repair<span className="text-[#C86A37]">Series</span>
          </span>
        </div>

        {/* Subtitle / Tagline */}
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748B]">
          Home Services & Repairs
        </p>

        {/* Minimal Progress Bar */}
        <div className="mt-6 h-1 w-36 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-full bg-gradient-to-r from-[#C86A37] via-[#7E1926] to-[#C86A37] animate-pulse" />
        </div>
      </div>

      {/* Vanilla JS Fallback: Injects CSS rules into document.head to guarantee dismissal without touching DOM attributes on the React node (zero hydration mismatch) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                if (sessionStorage.getItem('rs_splash_shown')) {
                  var s = document.getElementById('rs-splash-css') || document.createElement('style');
                  s.id = 'rs-splash-css';
                  s.textContent = '#rs-splash-screen { display: none !important; }';
                  if (!s.parentNode) document.head.appendChild(s);
                  return;
                }
              } catch(e) {}
              setTimeout(function() {
                var s = document.getElementById('rs-splash-css') || document.createElement('style');
                s.id = 'rs-splash-css';
                s.textContent = '#rs-splash-screen { opacity: 0 !important; pointer-events: none !important; }';
                if (!s.parentNode) document.head.appendChild(s);
              }, 650);
              setTimeout(function() {
                var s = document.getElementById('rs-splash-css') || document.createElement('style');
                s.id = 'rs-splash-css';
                s.textContent = '#rs-splash-screen { display: none !important; }';
                if (!s.parentNode) document.head.appendChild(s);
                try { sessionStorage.setItem('rs_splash_shown', '1'); } catch(e) {}
              }, 950);
            })();
          `,
        }}
      />
    </div>
  );
}
