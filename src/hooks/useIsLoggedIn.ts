import { useSyncExternalStore } from "react";
import { AUTH_CHANGED_EVENT, hasAuthToken } from "@/lib/authRedirect";

const subscribe = (onChange: () => void) => {
  window.addEventListener(AUTH_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange); // login/logout in another tab
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};

/** Whether a session token is stored. False on the server and during hydration,
 *  then follows login/logout without a page reload. */
export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, hasAuthToken, () => false);
}
