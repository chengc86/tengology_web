import { useSyncExternalStore } from "react";

/**
 * True once the client has hydrated, false during server rendering.
 *
 * The cart is persisted in localStorage, which the server can't see, so any
 * component that reads it must render the empty state first and only show real
 * contents after hydration — otherwise the server and client markup disagree.
 *
 * `useSyncExternalStore` is the right tool here rather than a mount effect: it
 * returns the server snapshot during SSR and the client snapshot immediately
 * after, without a second render pass.
 */

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
