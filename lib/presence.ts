"use client";

import { useSyncExternalStore } from "react";

/**
 * App-wide co-parent presence, fed by the root chat/presence socket
 * (OnlineSocketManager in components/global/AuthGate.tsx). Signing in opens that
 * socket, which is what marks *this* user online to the backend and delivers the
 * partner's status here — so any screen can read it without opening a socket of
 * its own.
 *
 * `null` means "not known yet", which is different from "offline" and should be
 * rendered differently.
 */
export type PartnerPresence = boolean | null;

const STORAGE_KEY = "pb:partner-online";

let partnerOnline: PartnerPresence = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist(value: PartnerPresence) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, value ? "online" : "offline");
  } catch {
    // Ignore storage failures (private mode, blocked storage, etc.)
  }
}

function readPersisted(): PartnerPresence {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "online") return true;
    if (stored === "offline") return false;
  } catch {
    // Ignore storage failures.
  }
  return null;
}

export function setPartnerOnline(next: boolean) {
  hydrated = true;
  if (partnerOnline === next) return;
  partnerOnline = next;
  persist(next);
  emit();
}

/**
 * Presence is unknown again — call this when the socket drops. Reporting a stale
 * "online" while disconnected is worse than admitting we do not know.
 */
export function clearPartnerPresence() {
  hydrated = true;
  if (partnerOnline === null) return;
  partnerOnline = null;
  persist(null);
  emit();
}

export function getPartnerOnline(): PartnerPresence {
  if (!hydrated) {
    partnerOnline = readPersisted();
    hydrated = true;
  }
  return partnerOnline;
}

function getServerSnapshot(): PartnerPresence {
  return null;
}

export function subscribePartnerPresence(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePartnerOnline(): PartnerPresence {
  return useSyncExternalStore(subscribePartnerPresence, getPartnerOnline, getServerSnapshot);
}
