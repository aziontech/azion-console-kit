// /** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: [ 
    '../src/**/*.stories.@(js)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@chromatic-com/storybook',
    '@storybook/addon-themes',
    "@whitespace/storybook-addon-html"
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {}
  },
  docs: {
    defaultName: 'Documentation',
  }
}

export default config