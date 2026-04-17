import ResizableSplitter from '@/components/ResizableSplitter.vue';

export default {
  title: 'Components/ResizableSplitter',
  component: ResizableSplitter,
  tags: ['autodocs'],
  argTypes: {
    panelSizes: {
      control: 'object',
      description: 'Initial sizes of the two panels as percentages [top, bottom]'
    },
    minSize: {
      control: 'object',
      description: 'Minimum sizes for each panel as percentages'
    },
    maxSize: {
      control: 'object',
      description: 'Maximum sizes for each panel as percentages'
    },
    initialTopPanelPercent: {
      control: 'number',
      description: 'Initial top panel size as percentage (alternative to panelSizes)'
    },
    initialTopPanelPixels: {
      control: 'number',
      description: 'Initial top panel size in pixels (takes priority over percentage)'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A vertical resizable splitter component that divides the viewport into top and bottom panels. Users can drag the divider to resize panels. Supports minimum/maximum size constraints and emits events for size changes.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { ResizableSplitter },
    setup() {
      return { args };
    },
    template: `
      <div style="height: 400px; border: 1px solid #e5e7eb; border-radius: 4px;">
        <ResizableSplitter v-bind="args">
          <template #panel-a>
            <div class="p-4 bg-blue-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Top Panel (Panel A)</h3>
                <p class="text-sm text-gray-600">Drag the divider below to resize</p>
              </div>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-green-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Bottom Panel (Panel B)</h3>
                <p class="text-sm text-gray-600">This panel will resize accordingly</p>
              </div>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    panelSizes: [50, 50],
    minSize: [10, 10],
    maxSize: [90, 90]
  }
};

export const InitialTopPanelSize = {
  render: (args) => ({
    components: { ResizableSplitter },
    setup() {
      return { args };
    },
    template: `
      <div style="height: 400px; border: 1px solid #e5e7eb; border-radius: 4px;">
        <ResizableSplitter v-bind="args">
          <template #panel-a>
            <div class="p-4 bg-purple-50 h-full flex items-center justify-center">
              <h3 class="font-semibold text-lg">Top Panel - 70% Height</h3>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-yellow-50 h-full flex items-center justify-center">
              <h3 class="font-semibold text-lg">Bottom Panel - 30% Height</h3>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    initialTopPanelPercent: 70
  }
};

export const ConstrainedSizes = {
  render: (args) => ({
    components: { ResizableSplitter },
    setup() {
      return { args };
    },
    template: `
      <div style="height: 400px; border: 1px solid #e5e7eb; border-radius: 4px;">
        <ResizableSplitter v-bind="args">
          <template #panel-a>
            <div class="p-4 bg-red-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Top Panel (30-60%)</h3>
                <p class="text-sm text-gray-600">Panel constrained between 30% and 60%</p>
              </div>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-blue-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Bottom Panel</h3>
                <p class="text-sm text-gray-600">Try to drag beyond constraints</p>
              </div>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    panelSizes: [40, 60],
    minSize: [30, 40],
    maxSize: [60, 70]
  }
};