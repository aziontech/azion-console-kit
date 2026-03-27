import SkeletonBlock from '@/templates/skeleton-block/index.vue';

export default {
  title: 'Templates/SkeletonBlock',
  component: SkeletonBlock,
  tags: ['autodocs'],
  argTypes: {
    rows: {
      control: 'number',
      description: 'Number of skeleton rows to display'
    }
  }
};

export const Default = {
  args: {
    rows: 5
  }
};

export const FewRows = {
  args: {
    rows: 2
  }
};

export const ManyRows = {
  args: {
    rows: 10
  }
};
