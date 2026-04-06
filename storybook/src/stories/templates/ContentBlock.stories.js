import ContentBlock from '@/templates/content-block/index.vue';

export default {
  title: 'Templates/ContentBlock',
  component: ContentBlock,
  tags: ['autodocs'],
  argTypes: {
    disablePadding: {
      control: 'boolean',
      description: 'Disables default padding around the content'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A flexible content container with support for heading and content slots, with optional padding.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { ContentBlock },
    setup() {
      return { args };
    },
    template: `
      <ContentBlock v-bind="args">
        <template #heading>
          <h2 class="text-xl font-semibold">Section Heading</h2>
        </template>
        <template #content>
          <div class="space-y-4">
            <p>This is the main content area where you can place any components or content.</p>
            <p>It provides flexible layout with optional padding.</p>
          </div>
        </template>
      </ContentBlock>
    `
  }),
  args: {
    disablePadding: false
  }
};

export const WithoutHeading = {
  render: (args) => ({
    components: { ContentBlock },
    setup() {
      return { args };
    },
    template: `
      <ContentBlock v-bind="args">
        <template #content>
          <div class="space-y-4">
            <p>This content block has no heading slot.</p>
            <p>Useful for simple content sections.</p>
          </div>
        </template>
      </ContentBlock>
    `
  }),
  args: {
    disablePadding: false
  }
};

export const NoPadding = {
  render: (args) => ({
    components: { ContentBlock },
    setup() {
      return { args };
    },
    template: `
      <ContentBlock v-bind="args">
        <template #heading>
          <h2 class="text-xl font-semibold">Full Width Content</h2>
        </template>
        <template #content>
          <div class="space-y-4">
            <p>This content block has no default padding.</p>
            <p>Useful when you need custom spacing.</p>
          </div>
        </template>
      </ContentBlock>
    `
  }),
  args: {
    disablePadding: true
  }
};
