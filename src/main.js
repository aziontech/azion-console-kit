/**
 * ==== styles block ====
 */
import '@assets/c3.scss'
import '@assets/icons/azionicons.scss'
import '@assets/themes/scss/themes/azion-dark/theme.scss'
import '@assets/themes/scss/themes/azion-light/theme.scss'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import './assets/main.css'
/**
 * ==== End of styles block ====
 */

import * as HelpCenterServices from '@/services/help-center-services'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.config.globalProperties.HelpCenterServices = HelpCenterServices
app.use(PrimeVue)
app.directive('tooltip', Tooltip)
app.use(ToastService)
app.use(pinia)
app.use(router)
app.use(VueMonacoEditorPlugin, {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.38.0/min/vs'
  },
  options: {
    showSlider: 'mouseover'
  }
})

app.mount('#app')
