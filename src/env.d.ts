/// <reference types="vite/client" />

/**
 * Extiende ImportMeta para incluir las variables de entorno con prefijo NG_APP_
 * que Angular expone en tiempo de build desde el archivo .env
 *
 * Si agregas nuevas variables al .env, agrégalas aquí también.
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly NG_APP_FIREBASE_API_KEY: string;
  readonly NG_APP_FIREBASE_AUTH_DOMAIN: string;
  readonly NG_APP_FIREBASE_PROJECT_ID: string;
  readonly NG_APP_FIREBASE_STORAGE_BUCKET: string;
  readonly NG_APP_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly NG_APP_FIREBASE_APP_ID: string;
}