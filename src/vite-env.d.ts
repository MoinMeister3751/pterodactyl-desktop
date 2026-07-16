/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_APPLICATION_API?: string;
  readonly VITE_DEFAULT_REFRESH_INTERVAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
