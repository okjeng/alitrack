/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA4_ID?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CHANNEL_PLUGIN_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
