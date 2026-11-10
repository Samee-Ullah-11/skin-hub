"use client";

import { useEffect } from "react";

/** The browser rejects view transitions while the tab is hidden ("Document hidden"); run the update without animating instead. */
export function ViewTransitionGuard() {
  useEffect(() => {
    const native = document.startViewTransition;
    if (!native || document.startViewTransition !== Document.prototype.startViewTransition) return;
    document.startViewTransition = function (arg) {
      if (document.visibilityState === "visible") return native.call(document, arg);
      const update = typeof arg === "function" ? arg : arg?.update;
      const done = Promise.resolve()
        .then(() => update?.())
        .then(() => undefined);
      return { ready: done, finished: done, updateCallbackDone: done, skipTransition() {}, types: new Set(typeof arg === "object" ? arg?.types : []) };
    };
  }, []);
  return null;
}
