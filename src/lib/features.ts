/**
 * True once the backend's 4 November release (hashtag-backend 4b5729f: saved
 * graphics, the $35 per new graphic, ShipStation after payment) is live.
 *
 * Set NEXT_PUBLIC_NOV4_RELEASE=true and rebuild the same day that release
 * deploys. Until then the shop keeps today's flow, which is the only one
 * today's API can serve: it has no POST graphics, it prices shipping from the
 * amount the shop sends, and it buys the label when the shop asks.
 *
 * Remove this flag and its old branches once the release has settled.
 */
export const NOV4_RELEASE = process.env.NEXT_PUBLIC_NOV4_RELEASE === "true";
