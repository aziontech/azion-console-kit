import BaseDeployCard from '@/templates/deploy-template/BaseDeployCard.vue';

export default {
  title: 'Templates/BaseDeployCard',
  component: BaseDeployCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed in the card header'
    },
    titleSize: {
      control: 'text',
      description: 'Tailwind CSS class for title size'
    },
    hideFooter: {
      control: 'boolean',
      description: 'Hide the footer section'
    },
    loading: {
      control: 'boolean',
      description: 'Show loading skeleton state'
    },
    withoutBorder: {
      control: 'boolean',
      description: 'Remove border from header-meta section'
    },
    backgroundcontent: {
      control: 'text',
      description: 'Additional CSS classes for content background'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Base presentational card component for deploy template flow. Provides a consistent layout with header, content, and footer sections. 100% stateless - all state management is handled by parent components.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { BaseDeployCard },
    setup() {
      return { args };
    },
    template: `
      <BaseDeployCard v-bind="args">
        <template #header-right>
          <span class="text-sm">Optional header right content</span>
        </template>
        <template #content>
          <div class="space-y-4">
            <p class="text-sm text-color-secondary">
              This is the main content area. Add your form inputs, information, or any other components here.
            </p>
          </div>
        </template>
        <template #footer>
          <button class="px-4 py-2 bg-primary text-white rounded-md">
            Next
          </button>
        </template>
      </BaseDeployCard>
    `
  }),
  args: {
    title: 'Card Title',
    titleSize: 'text-xl',
    hideFooter: false,
    loading: false,
    withoutBorder: false,
    backgroundcontent: ''
  }
};

export const Loading = {
  render: (args) => ({
    components: { BaseDeployCard },
    setup() {
      return { args };
    },
    template: `
      <BaseDeployCard v-bind="args">
        <template #content>
          <div class="space-y-4">
            <p>Content that will be replaced by skeleton when loading.</p>
          </div>
        </template>
      </BaseDeployCard>
    `
  }),
  args: {
    title: 'Loading Card',
    loading: true
  }
};

export const WithHeaderMeta = {
  render: (args) => ({
    components: { BaseDeployCard },
    setup() {
      return { args };
    },
    template: `
      <BaseDeployCard v-bind="args">
        <template #header-right>
          <span class="text-sm text-color-secondary">2 minutes ago</span>
        </template>
        <template #header-meta>
          <div class="flex gap-4 text-sm">
            <span><strong>Status:</strong> Active</span>
            <span><strong>Type:</strong> Production</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <p>Main content with header-meta section above.</p>
          </div>
        </template>
        <template #footer>
          <button class="px-4 py-2 bg-primary text-white rounded-md">
            Save Changes
          </button>
        </template>
      </BaseDeployCard>
    `
  }),
  args: {
    title: 'Card with Meta',
    titleSize: 'text-xl',
    hideFooter: false
  }
};

export const WithoutFooter = {
  render: (args) => ({
    components: { BaseDeployCard },
    setup() {
      return { args };
    },
    template: `
      <BaseDeployCard v-bind="args">
        <template #content>
          <div class="space-y-4">
            <p>This card has no footer section.</p>
            <p class="text-sm text-color-secondary">
              Useful for read-only or display-only content.
            </p>
          </div>
        </template>
      </BaseDeployCard>
    `
  }),
  args: {
    title: 'Card Without Footer',
    hideFooter: true
  }
};

export const CustomBackground = {
  render: (args) => ({
    components: { BaseDeployCard },
    setup() {
      return { args };
    },
    template: `
      <BaseDeployCard v-bind="args">
        <template #content>
          <div class="space-y-4">
            <p>Content with custom background color.</p>
          </div>
        </template>
        <template #footer>
          <button class="px-4 py-2 bg-primary text-white rounded-md">
            Continue
          </button>
        </template>
      </BaseDeployCard>
    `
  }),
  args: {
    title: 'Custom Background',
    backgroundcontent: 'bg-surface-100'
  }
};
