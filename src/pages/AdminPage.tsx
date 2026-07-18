import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NodesTable } from "@/features/admin/components/NodesTable";
import { LocationsTable } from "@/features/admin/components/LocationsTable";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { AdminServersTable } from "@/features/admin/components/AdminServersTable";
import { ProfileFormModal } from "@/features/profiles/components/ProfileFormModal";
import { useAdminNodes, useAdminUsers, useAdminLocations } from "@/features/admin/hooks";
import { useProfileStore } from "@/store/useProfileStore";

const TABS: TabItem[] = [
  { key: "nodes", label: "Nodes" },
  { key: "locations", label: "Locations" },
  { key: "users", label: "Nutzer" },
  { key: "servers", label: "Alle Server" },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState("nodes");
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const navigate = useNavigate();
  const activeProfile = useProfileStore((s) => s.activeProfile());
  const hasApplicationApiKey = !!activeProfile?.applicationApiKey;

  // Werden hier zentral geladen, da mehrere Tabs (Nodes<->Locations, Server<->Nodes/Nutzer)
  // sich gegenseitig referenzieren und Namen statt roher IDs anzeigen sollen.
  const { data: nodes } = useAdminNodes();
  const { data: users } = useAdminUsers();
  const { data: locations } = useAdminLocations();

  if (!hasApplicationApiKey) {
    return (
      <>
        <TopBar title="Admin" />
        <main className="flex flex-1 items-center justify-center p-5">
          <EmptyState
            title="Kein Application-API-Key hinterlegt"
            description={
              activeProfile
                ? `Das aktive Profil "${activeProfile.name}" hat keinen Application-API-Key. Die Admin-Ansicht (Nodes, Locations, Nutzer, alle Server) benötigt einen Key mit Leserechten.`
                : "Kein Profil aktiv."
            }
            action={
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => setEditProfileOpen(true)} disabled={!activeProfile}>
                  Application-API-Key hinzufügen
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Zum Dashboard
                </Button>
              </div>
            }
          />
        </main>
        <ProfileFormModal
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          editingProfile={activeProfile}
        />
      </>
    );
  }

  return (
    <>
      <TopBar title="Admin" subtitle="Panel-weite Übersicht über die Application API" />
      <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-5">
        {activeTab === "nodes" && <NodesTable locations={locations} />}
        {activeTab === "locations" && <LocationsTable nodes={nodes} />}
        {activeTab === "users" && <UsersTable />}
        {activeTab === "servers" && <AdminServersTable nodes={nodes} users={users} />}
      </main>
    </>
  );
}
