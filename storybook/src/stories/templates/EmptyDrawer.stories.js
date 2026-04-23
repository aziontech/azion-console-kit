import EmptyDrawer from '@/templates/empty-drawer/index.vue';

export default {
  title: 'Templates/EmptyDrawer',
  component: EmptyDrawer,
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Controls drawer visibility'
    },
    title: {
      control: 'text',
      description: 'Drawer title'
    },
    expandable: {
      control: 'boolean',
      description: 'Allows drawer to expand'
    },
    expandedDefault: {
      control: 'boolean',
      description: 'Sets drawer expanded by default'
    },
    isOverlapped: {
      control: 'boolean',
      description: 'Adjusts drawer width when overlapped'
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { EmptyDrawer },
    setup() {
      return { args };
    },
    template: `
      <EmptyDrawer v-model:visible="args.visible" v-bind="args">
        <template #content>
          <div class="p-4">
            <p class="text-color-secondary">Drawer content goes here</p>
          </div>
        </template>
        <template #footer>
          <div class="p-4 border-t surface-border">
            <p class="text-sm text-color-secondary">Footer content</p>
          </div>
        </template>
      </EmptyDrawer>
    `
  }),
  args: {
    visible: true,
    title: 'Drawer Title',
    expandable: false,
    expandedDefault: false,
    isOverlapped: false
  }
};