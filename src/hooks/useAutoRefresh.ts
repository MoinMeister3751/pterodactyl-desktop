import { useEffect, useRef } from "react";

/**
 * Ruft `callback` sofort und danach in festen Intervallen auf. Pausiert
 * automatisch, wenn `enabled=false` oder `intervalSeconds<=0` ist - so lassen
 * sich Polling-Intervalle (z. B. Ressourcen-Widget) zentral aus den
 * Einstellungen steuern, ohne dass jede Stelle eigene Timer verwaltet.
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalSeconds: number,
  enabled = true,
) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled || intervalSeconds <= 0) return;

    let cancelled = false;
    const tick = () => {
      if (!cancelled) void savedCallback.current();
    };

    tick();
    const id = setInterval(tick, intervalSeconds * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalSeconds, enabled]);
}
