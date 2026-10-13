import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during the server render and hydration, true afterwards — for
 *  browser-only UI such as portals. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
