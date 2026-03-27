import PageHeadingBlockTabs from '@/templates/page-heading-block-tabs/index.vue';

export default {
  title: 'Templates/PageHeadingBlockTabs',
  component: PageHeadingBlockTabs,
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
    title: 'Page Title with Tabs',
    description: 'This page has tab navigation'
  }
};
