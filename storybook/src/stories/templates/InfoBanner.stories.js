import InfoBanner from '@/templates/info-banner/index.vue';

export default {
  title: 'Templates/InfoBanner',
  component: InfoBanner,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Banner title'
    },
    message: {
      control: 'text',
      description: 'Banner message'
    },
    type: {
      control: 'select',
      options: ['info', 'warning', 'error', 'success'],
      description: 'Banner type/variant'
    }
  }
};

export const Default = {
  args: {
    title: 'Information',
    message: 'This is an informational banner',
    type: 'info'
  }
};

export const Warning = {
  args: {
    title: 'Warning',
    message: 'Please review this important information',
    type: 'warning'
  }
};

export const Error = {
  args: {
    title: 'Error',
    message: 'An error has occurred',
    type: 'error'
  }
};

export const Success = {
  args: {
    title: 'Success',
    message: 'Operation completed successfully',
    type: 'success'
  }
};
