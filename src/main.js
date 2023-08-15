/**
 * ==== styles block ====
 */
import './assets/main.css'
import 'primeicons/primeicons.css';    
// import 'primevue/resources/themes/lara-dark-blue/theme.css';
// import '@/assets/themes/azion-dark-theme.css';
import '@/assets/themes/theme-custom.css';
/**
 * ==== End of styles block ====
*/

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import ToastService from 'primevue/toastservice';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(PrimeVue);
app.directive('tooltip', Tooltip);
app.use(ToastService);
app.use(createPinia())
app.use(router)

app.mount('#app')
