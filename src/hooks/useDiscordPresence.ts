import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useProfileStore } from "@/store/useProfileStore";

function describePresence(pathname: string, identifier: string | undefined, profileName: string | undefined) {
  if (pathname === "/profiles") {
    return { details: "Verwaltet Panel-Profile", state: "" };
  }
  if (pathname.startsWith("/servers/") && identifier) {
    return { details: "Verwaltet einen Server", state: identifier };
  }
  if (pathname === "/admin") {
    return { details: "Im Admin-Bereich", state: profileName ?? "" };
  }
  if (pathname === "/settings") {
    return { details: "In den Einstellungen", state: "" };
  }
  return { details: "Im Dashboard", state: profileName ? `Panel: ${profileName}` : "" };
}

/**
 * Aktualisiert die Discord Rich Presence anhand der aktuellen Ansicht. Muss
 * innerhalb des Routers gerendert werden (nutzt useLocation/useParams). Baut
 * die Verbindung nur auf, wenn in den Einstellungen aktiviert - Discord muss
 * dafür lokal laufen, andernfalls schlägt der Connect-Versuch einfach fehl
 * und wird ignoriert (kein Fehler-Toast, da rein kosmetisches Feature).
 */
export function useDiscordPresence() {
  const enabled = useSettingsStore((s) => s.discordRichPresence);
  const location = useLocation();
  const params = useParams<{ identifier?: string }>();
  const profileName = useProfileStore((s) => s.activeProfile()?.name);
  const [connected, setConnected] = useState(false);
  const startTimestamp = useRef(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }
    let cancelled = false;
    invoke("discord_connect")
      .then(() => {
        if (!cancelled) setConnected(true);
      })
      .catch(() => {
        // Discord läuft vermutlich nicht - stillschweigend ignorieren.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      void invoke("discord_disconnect").catch(() => {});
    }
    return () => {
      void invoke("discord_disconnect").catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled || !connected) return;
    const { details, state } = describePresence(location.pathname, params.identifier, profileName);
    void invoke("discord_update_presence", {
      details,
      stateText: state,
      startTimestamp: startTimestamp.current,
    }).catch(() => {});
  }, [enabled, connected, location.pathname, params.identifier, profileName]);
}
