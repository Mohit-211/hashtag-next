/**
 * "Login required" round trip: remember where the user was and what they
 * were doing, send them to /login, then bring them back to the same page and
 * let that page restore its state and finish the action.
 *
 *  - The return route travels as `/login?returnTo=…` (and is also stored with
 *    the pending action), always sanitized to a same-origin path.
 *  - The pending action lives in sessionStorage (per tab, gone when the tab
 *    closes) and expires after PENDING_TTL_MS.
 *  - Pages consume it with `takePendingAuthAction`, which removes it before
 *    returning it, so it can only ever run once.
 */

import type { PendingFileEntry } from "./pendingAuthFiles";

export const AUTH_TOKEN_KEY = "hastagBillionaire";
/** Fired on window after a login/logout so contexts can refetch. */
export const AUTH_CHANGED_EVENT = "auth:changed";

const PENDING_KEY = "pendingAuthAction";
/** Legacy snapshot written by the full customizer (Productcustomizationpage). */
const LEGACY_CUSTOMIZATION_KEY = "pendingCustomization";
const PENDING_TTL_MS = 30 * 60 * 1000;
const DEFAULT_AFTER_LOGIN = "/categories";
/** Never bounce back into the auth pages themselves. */
const AUTH_ROUTES = ["/login", "/send-otp", "/verify-otp", "/forgot-password"];

/** An action a component asks to resume after login. */
export interface LoginResumeRequest {
  type: string;
  payload: unknown;
  /** Large files to carry along (stored in IndexedDB, see pendingAuthFiles). */
  files?: PendingFileEntry[];
}

export interface PendingAuthAction<T = unknown> {
  id: string;
  /** e.g. "product:add-to-cart" — each page only consumes the types it owns. */
  type: string;
  returnTo: string;
  payload: T;
  savedAt: number;
}

export const hasAuthToken = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return false;
  }
};

export const notifyAuthChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

/**
 * Returns a safe in-app path ("/a/b?x=1#y") or null. Rejects absolute and
 * protocol-relative URLs, backslash tricks, other origins and auth routes.
 */
export const sanitizeReturnTo = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  // Control characters can be used to smuggle a host past naive checks.
  if (/[\u0000-\u001F\u007F]/.test(value)) return null;
  if (typeof window === "undefined") return value;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (AUTH_ROUTES.some((r) => url.pathname === r || url.pathname.startsWith(`${r}/`))) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

/** The current in-app location, optionally with some query params changed. */
export const currentPath = (params?: Record<string, string | number | null | undefined>): string => {
  if (typeof window === "undefined") return "/";
  const url = new URL(window.location.href);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") url.searchParams.delete(k);
    else url.searchParams.set(k, String(v));
  });
  return `${url.pathname}${url.search}${url.hash}`;
};

/** `/login?returnTo=<returnTo>` (defaults to the current page). */
export const loginUrl = (returnTo: string = currentPath()): string => {
  const safe = sanitizeReturnTo(returnTo);
  return safe ? `/login?returnTo=${encodeURIComponent(safe)}` : "/login";
};

/** Appends a sanitized `returnTo` to another auth route (register → OTP → login). */
export const withReturnTo = (path: string, returnTo: string | null | undefined): string => {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe) return path;
  return `${path}${path.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(safe)}`;
};

const readPending = (): PendingAuthAction | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAuthAction;
    const returnTo = sanitizeReturnTo(parsed?.returnTo);
    if (!parsed?.type || !returnTo || !parsed.savedAt || Date.now() - parsed.savedAt > PENDING_TTL_MS) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return { ...parsed, returnTo };
  } catch {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* storage unavailable */
    }
    return null;
  }
};

/** Remembers an action to resume after login. Replaces any earlier one. */
export const savePendingAuthAction = <T>(
  type: string,
  payload: T,
  returnTo: string = currentPath()
): PendingAuthAction<T> | null => {
  const safe = sanitizeReturnTo(returnTo);
  if (!safe || typeof window === "undefined") return null;
  const action: PendingAuthAction<T> = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    returnTo: safe,
    payload,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(action));
    return action;
  } catch {
    return null;
  }
};

/** Reads the pending action of `type` without removing it (e.g. to restore a form after a cancelled login). */
export const peekPendingAuthAction = <T>(
  type: string,
  matches?: (payload: T) => boolean
): PendingAuthAction<T> | null => {
  const action = readPending() as PendingAuthAction<T> | null;
  if (!action || action.type !== type) return null;
  if (matches && !matches(action.payload)) return null;
  return action;
};

/** Removes and returns the pending action of `type` — at most one caller ever gets it. */
export const takePendingAuthAction = <T>(
  type: string,
  matches?: (payload: T) => boolean
): PendingAuthAction<T> | null => {
  const action = peekPendingAuthAction<T>(type, matches);
  if (action) clearPendingAuthAction();
  return action;
};

export const clearPendingAuthAction = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable */
  }
};

/**
 * Where to go after a successful login: the `returnTo` query param, else the
 * pending action's page, else the customizer's legacy snapshot, else the
 * default landing page.
 */
export const resolvePostLoginRedirect = (returnToParam: string | null | undefined): string => {
  const fromParam = sanitizeReturnTo(returnToParam);
  if (fromParam) return fromParam;
  const pending = readPending();
  if (pending) return pending.returnTo;
  if (typeof window !== "undefined") {
    try {
      const legacy = JSON.parse(sessionStorage.getItem(LEGACY_CUSTOMIZATION_KEY) ?? "null");
      const fromLegacy = sanitizeReturnTo(legacy?.returnTo);
      if (fromLegacy) return fromLegacy;
    } catch {
      /* ignore malformed snapshot */
    }
  }
  return DEFAULT_AFTER_LOGIN;
};
