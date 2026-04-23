import ActionBarBlock from '@/templates/action-bar-block/index.vue';
import GoBack from '@/templates/action-bar-block/go-back.vue';

export default {
  title: 'Templates/ActionBarBlock',
  component: ActionBarBlock,
  tags: ['autodocs'],
  argTypes: {
    loading: {
      control: 'boolean',
      description: 'Shows loading state for the submit button'
    },
    inDrawer: {
      control: 'boolean',
      description: 'Adjust styling for drawer context'
    },
    cancelDisabled: {
      control: 'boolean',
      description: 'Disable the cancel button'
    },
    primaryActionLabel: {
      control: 'text',
      description: 'Label for the primary action button'
    },
    secondaryActionLabel: {
      control: 'text',
      description: 'Label for the secondary action button'
    },
    goBack: {
      control: 'object',
      description: 'Custom function to handle go back action (for GoBack component)'
    }
  }
};

export const Default = {
  args: {
    loading: false,
    inDrawer: false,
    cancelDisabled: false,
    primaryActionLabel: 'Save',
    secondaryActionLabel: 'Cancel'
  }
};

export const Loading = {
  args: {
    loading: true,
    inDrawer: false,
    cancelDisabled: false,
    primaryActionLabel: 'Save',
    secondaryActionLabel: 'Cancel'
  }
};

export const InDrawer = {
  args: {
    loading: false,
    inDrawer: true,
    cancelDisabled: false,
    primaryActionLabel: 'Save',
    secondaryActionLabel: 'Cancel'
  }
};

export const CancelDisabled = {
  args: {
    loading: false,
    inDrawer: false,
    cancelDisabled: true,
    primaryActionLabel: 'Save',
    secondaryActionLabel: 'Cancel'
  }
};

export const CustomLabels = {
  args: {
    loading: false,
    inDrawer: false,
    cancelDisabled: false,
    primaryActionLabel: 'Submit',
    secondaryActionLabel: 'Go Back'
  }
};

// GoBack variations
export const GoBackDefault = {
  render: () => ({
    components: { GoBack },
    template: '<GoBack />'
  })
};

export const GoBackInDrawer = {
  render: () => ({
    components: { GoBack },
    template: '<GoBack :inDrawer="true" />'
  })
};

export const GoBackCustom = {
  render: () => ({
    components: { GoBack },
    setup() {
      const handleGoBack = () => alert('Custom go back action');
      return { handleGoBack };
    },
    template: '<GoBack :goBack="handleGoBack" />'
  })
};

export const GoBackCustomInDrawer = {
  render: () => ({
    components: { GoBack },
    setup() {
      const handleGoBack = () => alert('Custom go back action in drawer');
      return { handleGoBack };
    },
    template: '<GoBack :goBack="handleGoBack" :inDrawer="true" />'
  })
};