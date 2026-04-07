import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue';

export default {
  title: 'Templates/DialogUnsaved',
  component: DialogUnsaved,
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Controls dialog visibility'
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { DialogUnsaved },
    setup() {
      return { args };
    },
    template: '<DialogUnsaved v-bind="args" />'
  }),
  args: {
    visible: true
  }
};

export const Hidden = {
  render: (args) => ({
    components: { DialogUnsaved },
    setup() {
      return { args };
    },
    template: '<DialogUnsaved v-bind="args" />'
  }),
  args: {
    visible: false
  }
};