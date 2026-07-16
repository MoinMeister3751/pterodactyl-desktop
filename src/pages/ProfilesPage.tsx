import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "@/store/useProfileStore";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfileCard } from "@/features/profiles/components/ProfileCard";
import { ProfileFormModal } from "@/features/profiles/components/ProfileFormModal";
import type { PanelProfile } from "@/lib/types/profile";

export function ProfilesPage() {
  const profiles = useProfileStore((s) => s.profiles);
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const removeProfile = useProfileStore((s) => s.removeProfile);
  const touchLastUsed = useProfileStore((s) => s.touchLastUsed);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PanelProfile | null>(null);

  function openCreateModal() {
    setEditingProfile(null);
    setModalOpen(true);
  }

  function openEditModal(profile: PanelProfile) {
    setEditingProfile(profile);
    setModalOpen(true);
  }

  async function handleSelect(profile: PanelProfile) {
    await setActiveProfile(profile.id);
    await touchLastUsed(profile.id);
    navigate("/");
  }

  async function handleDelete(profile: PanelProfile) {
    const confirmed = await confirm({
      title: "Profil löschen?",
      description: `"${profile.name}" wird inklusive gespeicherter API-Keys entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`,
      confirmLabel: "Löschen",
      destructive: true,
    });
    if (!confirmed) return;
    await removeProfile(profile.id);
    toast.success("Profil gelöscht", profile.name);
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-y-auto bg-base-950 p-8">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17l4-10 4 10M6 13h4m3 4l4-10 4 10M15 13h4" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-base-100">Pterodactyl Desktop</h1>
          <p className="mt-1 text-sm text-base-400">
            Verbinde dich mit einem Pterodactyl-Panel, um deine Server zu verwalten.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-base-200">Gespeicherte Profile</h2>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            + Neues Profil
          </Button>
        </div>

        {profiles.length === 0 ? (
          <EmptyState
            title="Noch kein Panel verbunden"
            description="Lege ein Profil mit Panel-URL und API-Key an, um loszulegen."
            action={
              <Button variant="primary" onClick={openCreateModal}>
                Erstes Profil anlegen
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={profile.id === activeProfileId}
                onSelect={() => void handleSelect(profile)}
                onEdit={() => openEditModal(profile)}
                onDelete={() => void handleDelete(profile)}
              />
            ))}
          </div>
        )}
      </div>

      <ProfileFormModal open={modalOpen} onClose={() => setModalOpen(false)} editingProfile={editingProfile} />
    </div>
  );
}
