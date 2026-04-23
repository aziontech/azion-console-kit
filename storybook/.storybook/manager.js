import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

const azionTheme = create({
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

  // Toolbar default and accent colors
  barTextColor: '#b5b5b5',
  barSelectedColor: '#F3652B',
  barBg: '#111111',

  // Form colors
  inputBg: '#171717',
  inputBorder: '#3e3e3e',
  inputTextColor: '#ededed',
  inputBorderRadius: 4,

  // Brand
  brandTitle: 'Console Storybook',
  brandUrl: 'https://storybook-console.azion.app',
  brandImage: undefined,
  brandTarget: '_self',
});

addons.setConfig({
  theme: azionTheme,
  panelPosition: 'bottom',
  enableShortcuts: true,
  showToolbar: true,
  showPanel: true,
  showNav: true,
});
