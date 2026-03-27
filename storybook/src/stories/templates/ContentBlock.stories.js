import ContentBlock from '@/templates/content-block/index.vue';

export default {
  title: 'Templates/ContentBlock',
  component: ContentBlock,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the content block'
    },
    description: {
      control: 'text',
      description: 'Description text'
    }
  }
};

export const Default = {
  args: {
    title: 'Content Block Title',
    description: 'This is a description for the content block'
  }
};
