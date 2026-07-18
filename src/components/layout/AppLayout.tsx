import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useProfileStore } from "@/store/useProfileStore";

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export function AppLayout() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const touchLastUsed = useProfileStore((s) => s.touchLastUsed);

  // Vorher wurde "zuletzt verwendet" nur beim Klick auf "Verbinden" im
  // Profil-Screen gesetzt. Jetzt wird es aktualisiert, solange man tatsächlich
  // in einem Profil arbeitet: einmal beim Betreten und danach alle 5 Minuten.
  useEffect(() => {
    if (!activeProfileId) return;
    void touchLastUsed(activeProfileId);
    const id = setInterval(() => void touchLastUsed(activeProfileId), TOUCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeProfileId, touchLastUsed]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base-950 text-base-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
