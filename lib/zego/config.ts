// ZEGOCLOUD Call Kit configuration.
//
// The App ID is public and safe to ship in the browser bundle. The ServerSecret
// is NOT — it must never appear in a NEXT_PUBLIC_ variable. Kit tokens are built
// from a server-generated token04 (see lib/zego/token.ts).
// `??` is not enough here: an env var declared with no value is the empty string,
// which is *defined*, so it wins the coalesce and Number("") is 0. An empty
// NEXT_PUBLIC_ZEGO_APP_ID in .env.local also shadows a real one in .env.
const ZEGO_APP_ID_FALLBACK = 1836928569;

function parseAppId(raw: string | undefined): number {
  const trimmed = raw?.trim();
  if (!trimmed) return ZEGO_APP_ID_FALLBACK;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(
      `[Zego] NEXT_PUBLIC_ZEGO_APP_ID is not a valid App ID ("${trimmed}") — using the built-in default.`,
    );
    return ZEGO_APP_ID_FALLBACK;
  }
  return parsed;
}

export const ZEGO_APP_ID = parseAppId(process.env.NEXT_PUBLIC_ZEGO_APP_ID);

/** Ring timeout for an outgoing invitation, in seconds (SDK allows 1-600). */
export const ZEGO_CALL_TIMEOUT_SECONDS = 60;

export const isZegoConfigured = ZEGO_APP_ID > 0;

/**
 * Ringtones served from public/. Drop the mobile app's two files here so both
 * platforms sound alike:
 *   public/sounds/zego_incoming.mp3
 *   public/sounds/zego_outgoing.mp3
 * If the files are absent the SDK falls back to silence — the visual incoming
 * call dialog still appears.
 */
export const ZEGO_RINGTONES = {
  incomingCallUrl: "/sounds/zego_incoming.mp3",
  outgoingCallUrl: "/sounds/zego_outgoing.mp3",
};
