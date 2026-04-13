import DescriptionText from '@/components/description-text/descriptionText.vue';

export default {
  title: 'Components/DescriptionText',
  component: DescriptionText,
  tags: ['autodocs'],
  argTypes: {
    description: {
      control: 'text',
      description: 'The text content to display as description'
    },
    size: {
      control: 'select',
      options: ['normal', 'small'],
      description: 'Size variant: normal (text-sm) or small (text-xs)'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A simple text component for displaying descriptions with two size variants. Supports both plain text and raw HTML content through slots.'
      }
    }
  }
};

export const Default = {
  args: {
    description: 'This is a default description text that demonstrates the normal size variant. It can span multiple lines and maintains proper spacing.',
    size: 'normal'
  }
};

export const SmallSize = {
  args: {
    description: 'This is a small description text variant, useful for compact UIs or secondary information.',
    size: 'small'
  }
};

export const MultiLine = {
  args: {
    description: 'First line of description\nSecond line of description\nThird line of description',
    size: 'normal'
  }
};

export const WithRawHtml = {
  render: (args) => ({
    components: { DescriptionText },
    setup() {
      return { args };
    },
    template: `
      <DescriptionText v-bind="args">
        <template #rawHtml>
          <strong>Bold text</strong>, <em>italic text</em>, and
          <a href="#" class="text-blue-500 hover:underline">links</a> can be used here.
        </template>
      </DescriptionText>
    `
  }),
  args: {
    description: 'This description will be ignored when rawHtml slot is provided',
    size: 'normal'
  }
};

export const SmallWithRawHtml = {
  render: (args) => ({
    components: { DescriptionText },
    setup() {
      return { args };
    },
    template: `
      <DescriptionText v-bind="args">
        <template #rawHtml>
          <span class="text-xs">Small size with <strong>HTML content</strong></span>
        </template>
      </DescriptionText>
    `
  }),
  args: {
    description: 'Ignored when rawHtml slot is provided',
    size: 'small'
  }
};