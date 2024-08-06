/**
 * ==== styles block ====
 */
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/main.css'
import 'azion-theme/dark'
import 'azion-theme/light'
import '@assets/icons/azionicons.scss'
import '@assets/c3.scss'
/**
 * ==== End of styles block ====
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import ToastService from 'primevue/toastservice'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import * as HelpCenterServices from '@/services/help-center-services'
import DialogService from 'primevue/dialogservice'
import { customAiPrompt } from '@modules/azion-ai-chat/directives/custom-ai-prompt'
import StripeIntegrationPlugin from '@/plugins/StripeIntegrationPlugin'

import TrackerPlugin from '@/plugins/AnalyticsTrackerAdapterPlugin'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.config.globalProperties.HelpCenterServices = HelpCenterServices
app.use(PrimeVue)
app.directive('tooltip', Tooltip)
app.directive('prompt', customAiPrompt)
app.use(ToastService)
app.use(pinia)
app.use(router)
app.use(DialogService)
app.use(TrackerPlugin)
app.use(StripeIntegrationPlugin)
app.use(VueMonacoEditorPlugin, {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.38.0/min/vs'
  },
  options: {
    showSlider: 'mouseover'
  }
})

app.mount('#app')
