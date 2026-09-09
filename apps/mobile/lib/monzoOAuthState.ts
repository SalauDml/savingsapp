// Shared between connect-bank.tsx (writes) and auth/callback.tsx (reads +
// verifies) - the OAuth CSRF guard for the Monzo connect flow. See the
// comments in both call sites for why this exists: cait://auth/callback is
// a custom URL scheme, which any app or webpage on the device can open, not
// just Monzo's own redirect - without a per-flow nonce that's verified to
// round-trip unchanged, someone could craft their own
// cait://auth/callback?code=... and get the app to silently bind their own
// bank account's tokens to your profile.
export const OAUTH_STATE_KEY = 'monzo_oauth_state'

// Not backed by a real CSPRNG (expo-crypto isn't installed, and adding a
// native module now means another dev-build rebuild) - but this only needs
// to be unpredictable enough that an outside attacker can't guess it in
// advance, not withstand a targeted cryptographic attack. Fine for a
// single-user app; swap for expo-crypto's randomUUID() if this ever needs
// to defend more than one user.
export function generateOAuthState(): string {
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('') + Date.now().toString(36)
}
