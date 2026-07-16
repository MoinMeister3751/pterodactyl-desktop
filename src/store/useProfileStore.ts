import { create } from "zustand";
import { getStore } from "@/lib/storage";
import { STORE_FILE_NAME } from "@/lib/utils/constants";
import { normalizePanelUrl } from "@/lib/utils/validation";
import type { PanelProfile, PanelProfileDraft } from "@/lib/types/profile";

const PROFILES_KEY = "profiles";
const ACTIVE_PROFILE_KEY = "activeProfileId";

interface ProfileState {
  profiles: PanelProfile[];
  activeProfileId: string | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  addProfile: (draft: PanelProfileDraft) => Promise<PanelProfile>;
  updateProfile: (id: string, patch: Partial<PanelProfileDraft>) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string | null) => Promise<void>;
  touchLastUsed: (id: string) => Promise<void>;
  activeProfile: () => PanelProfile | null;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  isLoaded: false,

  load: async () => {
    const store = await getStore(STORE_FILE_NAME);
    const profiles = (await store.get<PanelProfile[]>(PROFILES_KEY)) ?? [];
    const activeProfileId = (await store.get<string>(ACTIVE_PROFILE_KEY)) ?? null;
    set({
      profiles,
      activeProfileId: profiles.some((p) => p.id === activeProfileId) ? activeProfileId : null,
      isLoaded: true,
    });
  },

  addProfile: async (draft) => {
    const profile: PanelProfile = {
      ...draft,
      panelUrl: normalizePanelUrl(draft.panelUrl),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const next = [...get().profiles, profile];
    set({ profiles: next });
    const store = await getStore(STORE_FILE_NAME);
    await store.set(PROFILES_KEY, next);
    await store.save();
    return profile;
  },

  updateProfile: async (id, patch) => {
    const next = get().profiles.map((p) =>
      p.id === id
        ? { ...p, ...patch, panelUrl: patch.panelUrl ? normalizePanelUrl(patch.panelUrl) : p.panelUrl }
        : p,
    );
    set({ profiles: next });
    const store = await getStore(STORE_FILE_NAME);
    await store.set(PROFILES_KEY, next);
    await store.save();
  },

  removeProfile: async (id) => {
    const next = get().profiles.filter((p) => p.id !== id);
    const nextActive = get().activeProfileId === id ? null : get().activeProfileId;
    set({ profiles: next, activeProfileId: nextActive });
    const store = await getStore(STORE_FILE_NAME);
    await store.set(PROFILES_KEY, next);
    await store.set(ACTIVE_PROFILE_KEY, nextActive);
    await store.save();
  },

  setActiveProfile: async (id) => {
    set({ activeProfileId: id });
    const store = await getStore(STORE_FILE_NAME);
    await store.set(ACTIVE_PROFILE_KEY, id);
    await store.save();
  },

  touchLastUsed: async (id) => {
    const next = get().profiles.map((p) =>
      p.id === id ? { ...p, lastUsedAt: new Date().toISOString() } : p,
    );
    set({ profiles: next });
    const store = await getStore(STORE_FILE_NAME);
    await store.set(PROFILES_KEY, next);
    await store.save();
  },

  activeProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },
}));
