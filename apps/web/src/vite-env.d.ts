/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Laisser vide en dev — proxy Vite /api → :3001 */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
