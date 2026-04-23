import ActionBarWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue';

export default {
  title: 'Templates/ActionBarWithTeleport',
  component: ActionBarWithTeleport,
  tags: ['autodocs'],
  argTypes: {
    id: {
      control: 'text',
      description: 'Target element ID for teleport',
      defaultValue: '#action-bar'
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state for the submit button'
    },
    cancelDisabled: {
      control: 'boolean',
      description: 'Disable the cancel button'
    },
    submitDisabled: {
      control: 'boolean',
      description: 'Disable the submit button'
    },
    primaryActionLabel: {
      control: 'text',
      description: 'Label for the primary action button',
      defaultValue: 'Save'
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { ActionBarWithTeleport },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div id="action-bar"></div>
        <ActionBarWithTeleport v-bind="args" />
      </div>
    `
  }),
  args: {
    id: '#action-bar',
    loading: false,
    cancelDisabled: false,
    submitDisabled: false,
    primaryActionLabel: 'Save'
  }
};

export const Loading = {
  render: (args) => ({
    components: { ActionBarWithTeleport },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div id="action-bar"></div>
        <ActionBarWithTeleport v-bind="args" />
      </div>
    `
  }),
  args: {
    id: '#action-bar',
    loading: true,
    cancelDisabled: false,
    submitDisabled: false,
    primaryActionLabel: 'Save'
  }
};

export const SubmitDisabled = {
  render: (args) => ({
    components: { ActionBarWithTeleport },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div id="action-bar"></div>
        <ActionBarWithTeleport v-bind="args" />
      </div>
    `
  }),
  args: {
    id: '#action-bar',
    loading: false,
    cancelDisabled: false,
    submitDisabled: true,
    primaryActionLabel: 'Save'
  }
};

export const CancelDisabled = {
  render: (args) => ({
    components: { ActionBarWithTeleport },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div id="action-bar"></div>
        <ActionBarWithTeleport v-bind="args" />
      </div>
    `
  }),
  args: {
    id: '#action-bar',
    loading: false,
    cancelDisabled: true,
    submitDisabled: false,
    primaryActionLabel: 'Save'
  }
};

export const CustomTarget = {
  render: (args) => ({
    components: { ActionBarWithTeleport },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div id="custom-action-bar"></div>
        <ActionBarWithTeleport v-bind="args" />
      </div>
    `
  }),
  args: {
    id: '#custom-action-bar',
    loading: false,
    cancelDisabled: false,
    submitDisabled: false,
    primaryActionLabel: 'Save'
  }
};

export const CustomLabel = {
  render: (args) => ({
    components: { ActionBarWithTeleport },
    setup() {
      return { args };
    },
    template: `
      <div>
        <div id="action-bar"></div>
        <ActionBarWithTeleport v-bind="args" />
      </div>
    `
  }),
  args: {
    id: '#action-bar',
    loading: false,
    cancelDisabled: false,
    submitDisabled: false,
    primaryActionLabel: 'Submit Form'
  }
};