import PageHeadingBlock from '@/templates/page-heading-block/index.vue';

export default {
  title: 'Templates/PageHeadingBlock',
  component: PageHeadingBlock,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Page heading title'
    },
    description: {
      control: 'text',
      description: 'Page heading description'
    }
  }
};

export const Default = {
  args: {
    title: 'Page Title',
    description: 'This is a page description'
  }
};
