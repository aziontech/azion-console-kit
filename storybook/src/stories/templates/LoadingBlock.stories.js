import LoadingBlock from '@/templates/loading-block/index.vue';

export default {
  title: 'Templates/LoadingBlock',
  component: LoadingBlock,
  tags: ['autodocs'],
  argTypes: {
    showLoading: {
      control: 'boolean',
      description: 'Toggle loading overlay visibility'
    },
    customClasses: {
      control: 'text',
      description: 'Custom CSS classes for the loading overlay'
    }
  }
};

export const Default = {
  args: {
    showLoading: true
  }
};

export const Hidden = {
  args: {
    showLoading: false
  }
};

export const CustomClasses = {
  args: {
    showLoading: true,
    customClasses: 'z-[5000] mt-[3.5rem] min-h-screen bg-blue-500/20'
  }
};
