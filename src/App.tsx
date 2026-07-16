import { useEffect, type ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProfilesPage } from "@/pages/ProfilesPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ServerDetailPage } from "@/pages/ServerDetailPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AdminPage } from "@/pages/AdminPage";
import { ToastHost } from "@/components/ui/Toast";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialog";
import { useProfileStore } from "@/store/useProfileStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUpdater } from "@/hooks/useUpdater";
import { Spinner } from "@/components/ui/Spinner";

function RequireProfile({ children }: { children: ReactNode }) {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  if (!activeProfileId) return <Navigate to="/profiles" replace />;
  return <>{children}</>;
}

export function App() {
  const loadProfiles = useProfileStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);
  const profilesLoaded = useProfileStore((s) => s.isLoaded);
  const settingsLoaded = useSettingsStore((s) => s.isLoaded);
  const { checkForUpdates } = useUpdater();

  useEffect(() => {
    void loadProfiles();
    void loadSettings();
    // Stiller Update-Check beim Start; Ergebnis erscheint als Badge in der TopBar.
    void checkForUpdates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profilesLoaded || !settingsLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base-950">
        <Spinner className="h-6 w-6 text-base-400" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route
          path="/"
          element={
            <RequireProfile>
              <AppLayout />
            </RequireProfile>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="servers/:identifier" element={<ServerDetailPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
      <ConfirmDialogHost />
    </HashRouter>
  );
}
