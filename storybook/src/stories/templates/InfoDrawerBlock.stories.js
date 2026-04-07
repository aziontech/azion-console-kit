import InfoDrawerBlock from '@/templates/info-drawer-block/index.vue';

export default {
  title: 'Templates/InfoDrawerBlock',
  component: InfoDrawerBlock,
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Controls drawer visibility'
    },
    title: {
      control: 'text',
      description: 'Drawer title'
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { InfoDrawerBlock },
    setup() {
      return { args };
    },
    template: `
      <InfoDrawerBlock v-model:visible="args.visible" v-bind="args">
        <template #body>
          <div class="p-4">
            <p class="text-color-secondary">Drawer body content goes here</p>
          </div>
        </template>
      </InfoDrawerBlock>
    `
  }),
  args: {
    visible: true,
    title: 'Information Drawer'
  }
};