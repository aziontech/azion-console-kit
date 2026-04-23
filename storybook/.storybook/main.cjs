const vue = require('@vitejs/plugin-vue').default;
const { resolve } = require('path');

/** @type {import('@storybook/vue3-vite').StorybookConfig} */
module.exports = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
    '@whitespace/storybook-addon-html'
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation'
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (config) => {
    // Add Vue plugin to handle .vue SFC files
    config.plugins = config.plugins || [];
    config.plugins.push(vue());

    // Configure path alias @ to point to src directory
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../../src'),
      '@templates': resolve(__dirname, '../../src/templates'),
      '@assets': resolve(__dirname, '../../src/assets'),
      '@layout': resolve(__dirname, '../../src/layout'),
      '@components': resolve(__dirname, '../../src/components'),
      '@stores': resolve(__dirname, '../../src/stores'),
      '@services': resolve(__dirname, '../../src/services'),
      '@views': resolve(__dirname, '../../src/views'),
      '@routes': resolve(__dirname, '../../src/router/routes'),
      '@modules': resolve(__dirname, '../../src/modules'),
      '@utils': resolve(__dirname, '../../src/utils')
    };
    config.resolve.extensions = config.resolve.extensions || ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'];

    // Enable dependency pre-bundling for faster rebuilds
    config.optimizeDeps = {
      ...config.optimizeDeps,
      include: [
        'vue',
        'primevue/config',
        'primevue/tooltip',
        'vee-validate'
      ],
      force: false
    };

    // Improve build performance
    config.build = {
      ...config.build,
      sourcemap: false,
      minify: false,
      chunkSizeWarningLimit: 1000
    };

    // Cache filesystem operations
    config.cacheDir = 'node_modules/.vite';

    return config;
  }
};