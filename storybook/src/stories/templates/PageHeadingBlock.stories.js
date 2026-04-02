import PageHeadingBlock from '@/templates/page-heading-block/index.vue';

export default {
  title: 'Templates/PageHeadingBlock',
  component: PageHeadingBlock,
  tags: ['autodocs'],
  argTypes: {
    pageTitle: {
      control: 'text',
      description: 'Page heading title (required)'
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title'
    },
    isRightAlignment: {
      control: 'boolean',
      description: 'Aligns content to the right'
    },
    tag: {
      control: 'object',
      description: 'Tag object to display'
    },
    loadedItemLabel: {
      control: 'text',
      description: 'Label for loaded breadcrumb item'
    },
    entityName: {
      control: 'text',
      description: 'Entity name for breadcrumb context'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A page heading component with breadcrumbs, title, description, and optional action slot.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { PageHeadingBlock },
    setup() {
      return { args };
    },
    template: `
      <PageHeadingBlock v-bind="args">
        <template #default>
          <button class="px-4 py-2 bg-blue-500 text-white rounded">Action Button</button>
        </template>
      </PageHeadingBlock>
    `
  }),
  args: {
    pageTitle: 'Page Title',
    description: 'This is a page description'
  }
};

export const WithActions = {
  render: (args) => ({
    components: { PageHeadingBlock },
    setup() {
      return { args };
    },
    template: `
      <PageHeadingBlock v-bind="args">
        <template #default>
          <button class="px-4 py-2 bg-green-500 text-white rounded mr-2">Edit</button>
          <button class="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
        </template>
      </PageHeadingBlock>
    `
  }),
  args: {
    pageTitle: 'Settings',
    description: 'Manage your application settings'
  }
};

export const WithoutDescription = {
  render: (args) => ({
    components: { PageHeadingBlock },
    setup() {
      return { args };
    },
    template: `
      <PageHeadingBlock v-bind="args">
        <template #default>
          <button class="px-4 py-2 bg-blue-500 text-white rounded">Action</button>
        </template>
      </PageHeadingBlock>
    `
  }),
  args: {
    pageTitle: 'Simple Page'
  }
};

export const WithoutActions = {
  args: {
    pageTitle: 'View Only Page',
    description: 'This page has no action buttons'
  }
};
