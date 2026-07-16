import { create } from "zustand";
import { getStore } from "@/lib/storage";
import { DEFAULT_REFRESH_INTERVAL_SECONDS, SETTINGS_STORE_FILE_NAME } from "@/lib/utils/constants";

export type ThemePreference = "dark" | "light" | "system";

interface AppSettings {
  theme: ThemePreference;
  refreshIntervalSeconds: number;
  debugMode: boolean;
  persistLogsLocally: boolean;
}

interface SettingsState extends AppSettings {
  isLoaded: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setRefreshInterval: (seconds: number) => Promise<void>;
  setDebugMode: (enabled: boolean) => Promise<void>;
  setPersistLogsLocally: (enabled: boolean) => Promise<void>;
}

const DEFAULTS: AppSettings = {
  theme: "dark",
  refreshIntervalSeconds: DEFAULT_REFRESH_INTERVAL_SECONDS,
  debugMode: false,
  persistLogsLocally: false,
};

const SETTINGS_KEY = "settings";

async function persist(settings: AppSettings) {
  const store = await getStore(SETTINGS_STORE_FILE_NAME);
  await store.set(SETTINGS_KEY, settings);
  await store.save();
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  isLoaded: false,

  load: async () => {
    const store = await getStore(SETTINGS_STORE_FILE_NAME);
    const saved = (await store.get<AppSettings>(SETTINGS_KEY)) ?? DEFAULTS;
    set({ ...DEFAULTS, ...saved, isLoaded: true });
    applyThemeClass(saved.theme ?? DEFAULTS.theme);
  },

  setTheme: async (theme) => {
    set({ theme });
    applyThemeClass(theme);
    await persist(extractSettings(get()));
  },

  setRefreshInterval: async (refreshIntervalSeconds) => {
    set({ refreshIntervalSeconds });
    await persist(extractSettings(get()));
  },

  setDebugMode: async (debugMode) => {
    set({ debugMode });
    await persist(extractSettings(get()));
  },

  setPersistLogsLocally: async (persistLogsLocally) => {
    set({ persistLogsLocally });
    await persist(extractSettings(get()));
  },
}));

function extractSettings(state: SettingsState): AppSettings {
  const { theme, refreshIntervalSeconds, debugMode, persistLogsLocally } = state;
  return { theme, refreshIntervalSeconds, debugMode, persistLogsLocally };
}

function applyThemeClass(theme: ThemePreference) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.toggle("dark", resolved === "dark");
}
