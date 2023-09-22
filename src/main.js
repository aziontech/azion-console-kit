/**
 * ==== styles block ====
 */
import './assets/main.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
// import 'primevue/resources/themes/lara-light-blue/theme.css';
//import '@/assets/themes/azion-dark-theme.css'
import '@/assets/themes/azion-light-theme.css'
//import '@/assets/themes/theme-custom.css'
/**
 * ==== End of styles block ====
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import ToastService from 'primevue/toastservice'

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

app.mount('#app')
