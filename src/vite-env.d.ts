/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT: 'development' | 'stage' | 'production'
  readonly VITE_SENTRY_UPLOAD: string
  readonly VITE_SENTRY_AUTH_TOKEN: string
  readonly VITE_DEBUG_PROXY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
