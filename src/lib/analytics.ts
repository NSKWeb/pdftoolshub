/**
 * Analytics is opt-in: nothing is loaded or sent unless a valid GA4
 * measurement ID (e.g. G-XXXXXXXXXX) is configured via the environment.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export function isAnalyticsEnabled(): boolean {
  return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
}
