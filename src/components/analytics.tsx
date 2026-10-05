"use client";

import Script from "next/script";
import { GA_MEASUREMENT_ID, isAnalyticsEnabled } from "@/lib/analytics";

/**
 * Google Analytics 4, loaded only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * IP anonymization is on by default.
 */
export function Analytics() {
  if (!isAnalyticsEnabled()) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
