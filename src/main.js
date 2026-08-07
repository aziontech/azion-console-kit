import '@aziontech/theme/globals.css'
import 'primeflex/primeflex.css'
import '@assets/main.css'
import '@assets/c3.scss'
import '@mdi/font/css/materialdesignicons.css'
import '@aziontech/theme'
import '@aziontech/icons'
import '@aziontech/webkit/styles/country-flags'

import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { WebkitPlugin } from '@aziontech/webkit/plugin'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import * as HelpCenterServices from '@/services/help-center-services'
import { customAiPrompt } from '@modules/azion-ai-chat/directives/custom-ai-prompt'

import TrackerPlugin from '@/plugins/AnalyticsTrackerAdapterPlugin'
import SentryPlugin from '@/plugins/sentry'
import { queryPlugin } from '@/services/v2/base/query/queryPlugin'
import { initOAuthSecurity } from '@/helpers/oauth-security'
import { loadRuntimeConfig } from '@/helpers/runtime-config'

import App from './App.vue'
import router from './router'

async function bootstrap() {
  // Runtime config must be resolved before anything reads environment values
  // (Sentry DSN, analytics tokens, SSO ids). Consumers evaluated during the
  // static import graph must stay lazy — read config at call time, never at
  // module scope.
  await loadRuntimeConfig()

  initOAuthSecurity()

  const app = createApp(App)

  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  setActivePinia(pinia)

  app.config.globalProperties.HelpCenterServices = HelpCenterServices
  app.use(WebkitPlugin)
  app.directive('prompt', customAiPrompt)
  app.use(pinia)

  app.use(router)
  app.use(queryPlugin)
  app.use(TrackerPlugin)
  app.use(SentryPlugin, {
    router
  })
  app.use(VueMonacoEditorPlugin, {
    paths: {
      vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.38.0/min/vs'
    },
    options: {
      showSlider: 'mouseover'
    }
  })

  app.mount('#app')
}

bootstrap().catch((error) => {
  // Surface bootstrap failures: without this they become silent unhandled
  // rejections (blank page, nothing in window.onerror-based monitoring).
  // eslint-disable-next-line no-console
  console.error('[bootstrap] failed to start the application', error)
  throw error
})
