/** Events analytics (PostHog / Plausible — brancher quand un outil est choisi). */
export type MarketplaceAnalyticsEvent =
  | "marketplace_view"
  | "tutor_profile_view"
  | "auth_gate_open"
  | "booking_complete";

export function trackMarketplaceEvent(
  event: MarketplaceAnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
): void {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event, properties);
  }
  // Brancher ici : window.plausible?.(event, { props: properties })
}
