import api from "@/lib/axios";

export type ZegoCredentials = {
  userID: string;
  userName: string;
  token: string;
  expiresAt: number;
};

let cached: ZegoCredentials | null = null;

/**
 * The same endpoint the mobile app uses. `user_id` is `str(request.user.id)` —
 * the identity scheme both clients must agree on, or invitations go to a user
 * that never rings.
 *
 * Renews five minutes early so a long call never dies on an expired token.
 */
export async function getZegoCredentials(force = false): Promise<ZegoCredentials> {
  if (!force && cached && cached.expiresAt > Date.now() + 5 * 60_000) return cached;

  console.log("[Zego] Fetching token from /api/v1/call/zego/token/");

  try {
    const { data } = await api.get("/api/v1/call/zego/token/");
    const payload = data?.data ?? data;

    console.log("[Zego] Token response payload:", payload);

    if (!payload?.token) {
      console.error("[Zego] Token endpoint returned no token:", payload);
      throw new Error("Call token endpoint returned no token.");
    }

    cached = {
      userID: String(payload.user_id),
      userName: payload.user_name || `User ${payload.user_id}`,
      token: payload.token,
      expiresAt: Date.now() + (payload.expires_in ?? 86400) * 1000,
    };

    console.log("[Zego] Token fetched successfully for user:", cached.userID);
    return cached;
  } catch (error) {
    console.error("[Zego] Failed to fetch Zego token:", error);
    throw error;
  }
}

export function clearZegoCredentials() {
  cached = null;
}
