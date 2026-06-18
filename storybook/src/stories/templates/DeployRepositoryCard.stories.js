import DeployRepositoryCard from '@/templates/deploy-template/DeployRepositoryCard.vue';

export default {
  title: 'Templates/DeployRepositoryCard',
  component: DeployRepositoryCard,
  tags: ['autodocs'],
  argTypes: {
    imagePreview: {
      control: 'text',
      description: 'URL for the template preview image'
    },
    previewAlt: {
      control: 'text',
      description: 'Alt text for preview image'
    },
    templateTitle: {
      control: 'text',
      description: 'Template name/title'
    },
    templateUrl: {
      control: 'text',
      description: 'Template documentation URL'
    },
    templateDescription: {
      control: 'text',
      description: 'Template description text'
    },
    githubUrl: {
      control: 'text',
      description: 'GitHub repository URL'
    },
    schema: {
      control: 'object',
      description: 'Form schema object'
    },
    isDrawer: {
      control: 'boolean',
      description: 'Whether rendered inside a drawer'
    },
    nextLabel: {
      control: 'text',
      description: 'Label for the next button'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state for the next button'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state for the next button'
    },
    collapsed: {
      control: 'boolean',
      description: 'When true, only show title and preview'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Step 1 of the deploy template flow. Displays template information with preview, handles VCS/GitHub integration, and provides form inputs for repository configuration.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { DeployRepositoryCard },
    setup() {
      return { args };
    },
    template: `
      <DeployRepositoryCard v-bind="args" @next="() => console.log('Next clicked')">
        <template #github-connection="slotProps">
          <div class="p-4 border border-dashed border-gray-400 rounded-md text-sm text-color-secondary">
            <p><strong>GitHub Connection Slot</strong></p>
            <p class="text-xs mt-1">hasIntegrationsList: {{ slotProps.hasIntegrationsList }}</p>
            <p class="text-xs">isLoading: {{ slotProps.isIntegrationsLoading }}</p>
          </div>
        </template>
        <template #inputs="slotProps">
          <div class="p-4 border border-dashed border-gray-400 rounded-md text-sm text-color-secondary">
            <p><strong>Inputs Slot</strong></p>
            <p class="text-xs mt-1">Schema: {{ JSON.stringify(slotProps.schema) }}</p>
          </div>
        </template>
      </DeployRepositoryCard>
    `
  }),
  args: {
    imagePreview: 'https://via.placeholder.com/120x80',
    previewAlt: 'Template Preview',
    templateTitle: 'Next.js Starter',
    templateUrl: 'https://docs.azion.com/templates/nextjs',
    templateDescription: 'A modern Next.js application template with optimized edge deployment configuration.',
    githubUrl: 'https://github.com/aziontech/azion-nextjs-template',
    schema: {},
    isDrawer: false,
    nextLabel: 'Next',
    loading: false,
    disabled: false,
    collapsed: false
  }
};

export const Collapsed = {
  render: (args) => ({
    components: { DeployRepositoryCard },
    setup() {
      return { args };
    },
    template: `
      <DeployRepositoryCard v-bind="args" />
    `
  }),
  args: {
    imagePreview: 'https://via.placeholder.com/120x80',
    previewAlt: 'Template Preview',
    templateTitle: 'Vue.js Starter',
    templateUrl: 'https://docs.azion.com/templates/vue',
    templateDescription: 'A Vue.js template with Vite and edge optimization.',
    collapsed: true
  }
};

export const Loading = {
  render: (args) => ({
    components: { DeployRepositoryCard },
    setup() {
      return { args };
    },
    template: `
      <DeployRepositoryCard v-bind="args">
        <template #github-connection>
          <div class="p-4 border border-dashed border-gray-400 rounded-md">
            <p class="text-sm text-color-secondary">GitHub connection area</p>
          </div>
        </template>
      </DeployRepositoryCard>
    `
  }),
  args: {
    templateTitle: 'React Starter',
    templateUrl: 'https://docs.azion.com/templates/react',
    loading: true
  }
};

export const WithFormInputs = {
  render: (args) => ({
    components: { DeployRepositoryCard },
    setup() {
      return { args };
    },
    template: `
      <DeployRepositoryCard v-bind="args">
        <template #github-connection="slotProps">
          <div class="p-4 border border-dashed border-gray-400 rounded-md text-sm">
            <p><strong>GitHub Integration</strong></p>
            <p class="text-xs text-color-secondary mt-1">Connected: {{ slotProps.hasIntegrationsList }}</p>
          </div>
        </template>
        <template #inputs>
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Repository Name</label>
              <input
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="my-awesome-project"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Branch</label>
              <input
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
                value="main"
              />
            </div>
          </div>
        </template>
      </DeployRepositoryCard>
    `
  }),
  args: {
    imagePreview: 'https://via.placeholder.com/120x80',
    templateTitle: 'Node.js Backend',
    templateUrl: 'https://docs.azion.com/templates/nodejs',
    templateDescription: 'A Node.js backend template with serverless functions support.',
    nextLabel: 'Configure',
    schema: { fields: ['name', 'branch'] }
  }
};

export const InDrawer = {
  render: (args) => ({
    components: { DeployRepositoryCard },
    setup() {
      return { args };
    },
    template: `
      <div class="max-w-md">
        <DeployRepositoryCard v-bind="args">
          <template #github-connection>
            <div class="p-4 border border-dashed border-gray-400 rounded-md text-sm">
              Compact GitHub connection for drawer
            </div>
          </template>
        </DeployRepositoryCard>
      </div>
    `
  }),
  args: {
    templateTitle: 'Quick Deploy',
    templateUrl: 'https://docs.azion.com/templates/quick',
    isDrawer: true,
    nextLabel: 'Deploy Now'
  }
};
