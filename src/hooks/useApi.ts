import { useMemo } from "react";
import { useProfileStore } from "@/store/useProfileStore";
import { createApplicationApi, createClientApi } from "@/lib/api/apiClientFactory";
import type { ClientApi } from "@/lib/api/clientApi";
import type { ApplicationApi } from "@/lib/api/applicationApi";

/** Liefert eine auf das aktive Profil zugeschnittene ClientApi-Instanz, oder null. */
export function useClientApi(): ClientApi | null {
  const profile = useProfileStore((s) => s.activeProfile());
  return useMemo(() => (profile ? createClientApi(profile) : null), [profile]);
}

/** Liefert eine ApplicationApi-Instanz, wenn das aktive Profil einen Admin-Key hat. */
export function useApplicationApi(): ApplicationApi | null {
  const profile = useProfileStore((s) => s.activeProfile());
  return useMemo(() => (profile ? createApplicationApi(profile) : null), [profile]);
}
