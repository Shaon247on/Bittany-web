// Call history + directory types. Ringing, signalling and media are owned by the
// ZEGOCLOUD Call Kit (see lib/zego/), so no SDP/ICE event types live here.

export interface WebRTCUser {
  id: number;
  email: string;
  name: string;
  username: string;
  image: string | null;
}

export interface CallHistoryItem {
  id: number;
  call_method?: "twilio" | "webrtc" | string;
  status?: "completed" | "missed" | "failed" | "pending" | "ringing" | "declined" | string;
  call_type?: "incoming" | "outgoing" | "missed" | string;
  start_time?: string | null;
  end_time?: string | null;
  duration?: number | null;
  timestamp?: string | null;
  caller_name?: string | null;
  receiver_user_name?: string | null;
  recordings?: Array<{ id?: number; recording_url?: string | null }>;
}
