/**
 * ==== styles block ====
 */
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
// import 'primevue/resources/themes/lara-light-blue/theme.css';
import './assets/main.css'
import '@assets/themes/scss/themes/azion-light/theme.scss'
import '@assets/themes/scss/themes/azion-dark/theme.scss'
// import '@/assets/themes/theme-custom.css'
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
import { VueReCaptcha } from 'vue-recaptcha-v3'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

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
app.use(VueReCaptcha, {
  siteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  loaderOptions: { badge: 'bottomleft' }
})

app.mount('#app')
