import { setup } from '@storybook/vue3';
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import { withThemeByClassName } from '@storybook/addon-themes'
import { injectCssVars } from '@aziontech/theme/tokens'
import { createRouter, createWebHistory } from 'vue-router'

import 'primeflex/primeflex.css'
import '../src/styles/preview.css';
import '@aziontech/theme'
import '@aziontech/icons'
import '@aziontech/webkit/styles/country-flags'

// Inject semantic token CSS variables for light/dark mode
injectCssVars()

// Create a mock router for Storybook
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/step-1', component: { template: '<div>Step 1</div>' } },
    { path: '/step-2', component: { template: '<div>Step 2</div>' } },
    { path: '/step-3', component: { template: '<div>Step 3</div>' } },
    { path: '/personal-info', component: { template: '<div>Personal Info</div>' } },
    { path: '/account-setup', component: { template: '<div>Account Setup</div>' } },
    { path: '/preferences', component: { template: '<div>Preferences</div>' } },
    { path: '/review', component: { template: '<div>Review</div>' } },
    { path: '/complete', component: { template: '<div>Complete</div>' } },
    { path: '/start', component: { template: '<div>Start</div>' } },
    { path: '/finish', component: { template: '<div>Finish</div>' } },
    { path: '/:pathMatch(.*)*', component: { template: '<div>Not Found</div>' } }
  ]
})

setup((app) => {
  app.use(PrimeVue, {
    ripple: false
  })

  app.use(mockRouter);
  app.directive('tooltip', Tooltip);
});

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i
    },
    expanded: true
  },
  docs: {
    source: {
      type: 'code'
    },
    theme: {
      base: 'dark',
      // Typography
      fontBase: '"Sora", sans-serif',
      fontCode: '"Roboto Mono", monospace',
      // Colors
      colorPrimary: '#F3652B',
      colorSecondary: '#585C6D',
      // UI
      appBg: '#0a0a0a',
      appContentBg: '#0a0a0a',
      appBorderColor: '#3e3e3e',
      appBorderRadius: 4,
      // Text colors
      textColor: '#ededed',
      textInverseColor: '#0a0a0a',
      // Toolbar
      barTextColor: '#b5b5b5',
      barSelectedColor: '#F3652B',
      barBg: '#111111',
      // Form
      inputBg: '#171717',
      inputBorder: '#3e3e3e',
      inputTextColor: '#ededed',
      inputBorderRadius: 4
    }
  },
  backgrounds: {
    default: 'azion azion-dark',
    values: [
      {
        name: 'azion-dark',
        value: '#0a0a0a'
      },
      {
        name: 'azion-light',
        value: '#ffffff'
      }
    ]
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['Introduction', 'Core', 'Components']
    }
  }
};

export const decorators = [
  withThemeByClassName({
    themes: {
      light: 'azion azion-light',
      dark: 'azion azion-dark',
    },
    defaultTheme: 'dark',
  })
]
