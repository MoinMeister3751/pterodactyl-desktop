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
  const navigate = useNavigate();
  const hasApplicationApiKey = useProfileStore((s) => !!s.activeProfile()?.applicationApiKey);

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
            description="Die Admin-Ansicht (Nodes, Locations, Nutzer, alle Server) benötigt einen Application-API-Key mit Leserechten. Trage ihn im aktiven Profil nach."
            action={
              <Button variant="primary" onClick={() => navigate("/profiles")}>
                Profil bearbeiten
              </Button>
            }
          />
        </main>
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
