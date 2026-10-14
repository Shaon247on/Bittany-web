import api from "@/lib/axios";

// Only the CALLER writes a history row, once per call — the same rule the mobile
// app follows, so the two clients cannot double-count. On the callee side
// activeCallLogId stays null and finishCallLog() is a no-op.
let activeCallLogId: number | null = null;

// A very fast decline can land before POST /logs/create/ has come back. Holding
// the in-flight promise lets finishCallLog() wait for the id instead of dropping
// the row in "pending" forever.
let pendingCreate: Promise<void> | null = null;

export async function createCallLog(receiverUserId: number | string) {
  pendingCreate = (async () => {
    try {
      const { data } = await api.post("/api/v1/call/logs/create/", {
        receiver_user: Number(receiverUserId),
        call_type: "outgoing",
        call_method: "webrtc",
        status: "pending",
      });
      activeCallLogId = (data?.data ?? data)?.id ?? null;
    } catch (error) {
      console.warn("[Zego] Failed to create call log:", error);
      activeCallLogId = null;
    }
  })();

  try {
    await pendingCreate;
  } finally {
    pendingCreate = null;
  }
}

export async function finishCallLog(
  status: "completed" | "missed" | "failed",
  durationSeconds = 0,
) {
  if (pendingCreate) await pendingCreate;

  // Clear first so a second callback for the same call cannot double-finalize.
  const id = activeCallLogId;
  activeCallLogId = null;
  if (id === null) return;

  try {
    await api.patch(`/api/v1/call/logs/${id}/update/`, {
      status,
      ...(durationSeconds > 0 ? { duration: Math.round(durationSeconds) } : {}),
    });
    if (status === "completed") {
      await api.post(`/api/v1/call/logs/${id}/end/`, {});
    }
  } catch (error) {
    console.warn("[Zego] Failed to finalize call log:", error);
  }
}
