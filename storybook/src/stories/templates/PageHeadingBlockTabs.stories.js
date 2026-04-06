import PageHeadingBlockTabs from '@/templates/page-heading-block-tabs/index.vue';

export default {
  title: 'Templates/PageHeadingBlockTabs',
  component: PageHeadingBlockTabs,
  tags: ['autodocs'],
  argTypes: {
    pageTitle: {
      control: 'text',
      description: 'Page heading title (required)'
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A page heading component with breadcrumbs, title, description, and tabs slot for navigation.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { PageHeadingBlockTabs },
    setup() {
      return { args };
    },
    template: `
      <PageHeadingBlockTabs v-bind="args">
        <template #default>
          <button class="px-4 py-2 bg-blue-500 text-white rounded">Create New</button>
        </template>
        <template #tabs>
          <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-100 rounded active">Tab 1</button>
            <button class="px-4 py-2 bg-gray-100 rounded">Tab 2</button>
            <button class="px-4 py-2 bg-gray-100 rounded">Tab 3</button>
          </div>
        </template>
      </PageHeadingBlockTabs>
    `
  }),
  args: {
    pageTitle: 'Page Title with Tabs',
    description: 'This page has tab navigation'
  }
};

export const WithActionsAndTabs = {
  render: (args) => ({
    components: { PageHeadingBlockTabs },
    setup() {
      return { args };
    },
    template: `
      <PageHeadingBlockTabs v-bind="args">
        <template #default>
          <button class="px-4 py-2 bg-green-500 text-white rounded mr-2">Edit</button>
          <button class="px-4 py-2 bg-blue-500 text-white rounded">Export</button>
        </template>
        <template #tabs>
          <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-100 rounded border-b-2 border-blue-500">Overview</button>
            <button class="px-4 py-2 bg-gray-100 rounded">Details</button>
            <button class="px-4 py-2 bg-gray-100 rounded">History</button>
          </div>
        </template>
      </PageHeadingBlockTabs>
    `
  }),
  args: {
    pageTitle: 'Dashboard',
    description: 'View and manage your dashboard metrics'
  }
};

export const MinimalConfig = {
  render: (args) => ({
    components: { PageHeadingBlockTabs },
    setup() {
      return { args };
    },
    template: `
      <PageHeadingBlockTabs v-bind="args">
        <template #tabs>
          <div class="flex gap-4 mt-4">
            <button class="px-4 py-2 bg-gray-100 rounded">Home</button>
            <button class="px-4 py-2 bg-gray-100 rounded">Settings</button>
          </div>
        </template>
      </PageHeadingBlockTabs>
    `
  }),
  args: {
    pageTitle: 'Simple Page'
  }
};
