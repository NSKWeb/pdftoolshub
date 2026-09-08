"use client";

import { useEffect, useRef } from "react";

const adSlots: Record<
  string,
  { "data-ad-slot": string; "data-ad-format": string; "data-full-width-responsive": string }
> = {
  header: {
    "data-ad-slot": "1234567890",
    "data-ad-format": "horizontal",
    "data-full-width-responsive": "true"
  },
  sidebar: {
    "data-ad-slot": "0987654321",
    "data-ad-format": "vertical",
    "data-full-width-responsive": "false"
  },
  footer: {
    "data-ad-slot": "5432167890",
    "data-ad-format": "auto",
    "data-full-width-responsive": "true"
  }
};

export function AdSlot({ position }: { position: "header" | "sidebar" | "footer" }) {
  const adRef = useRef<HTMLInsElement>(null);
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!adsenseClientId || !adRef.current) return;

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, [adsenseClientId]);

  if (!adsenseClientId) {
    return (
      <div className="gradient-border rounded-xl bg-panel/60 px-4 py-3 text-xs text-slate-400">
        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Advertisement</div>
        <div className="mt-2">Upgrade to Pro to remove ads</div>
      </div>
    );
  }

  const slotConfig = adSlots[position];

  return (
    <div className="gradient-border rounded-xl bg-panel/60 px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: "block", textAlign: "center", minHeight: "100px" }}
        data-ad-client={adsenseClientId}
        data-ad-slot={slotConfig["data-ad-slot"]}
        data-ad-format={slotConfig["data-ad-format"]}
        data-full-width-responsive={slotConfig["data-full-width-responsive"]}
      />
    </div>
  );
}
