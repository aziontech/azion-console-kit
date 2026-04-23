import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue';

export default {
  title: 'Components/Splitter',
  component: ResizableSplitter,
  tags: ['autodocs'],
  argTypes: {
    panelSizes: {
      control: 'object',
      description: 'Initial sizes of the two panels as percentages [primary, secondary]'
    },
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Split direction: horizontal (top-bottom) or vertical (left-right)'
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
      description: 'Initial primary panel size as percentage'
    },
    initialTopPanelPixels: {
      control: 'number',
      description: 'Initial primary panel size in pixels (takes priority)'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'Advanced resizable splitter supporting both horizontal (top-bottom) and vertical (left-right) layouts. Users can drag the divider to resize panels with constraints support.'
      }
    }
  }
};

export const Horizontal = {
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
                <p class="text-sm text-gray-600">Horizontal layout - Drag divider below</p>
              </div>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-green-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Bottom Panel (Panel B)</h3>
                <p class="text-sm text-gray-600">Resizes when you drag</p>
              </div>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    direction: 'horizontal',
    panelSizes: [50, 50]
  }
};

export const Vertical = {
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
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Left Panel (Panel A)</h3>
                <p class="text-sm text-gray-600">Vertical layout - Drag divider right</p>
              </div>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-yellow-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Right Panel (Panel B)</h3>
                <p class="text-sm text-gray-600">Resizes when you drag</p>
              </div>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    direction: 'vertical',
    panelSizes: [50, 50]
  }
};

export const ConstrainedVertical = {
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
                <h3 class="font-semibold text-lg mb-2">Left Panel (25-75%)</h3>
                <p class="text-sm text-gray-600">Constrained between 25% and 75%</p>
              </div>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-blue-50 h-full flex items-center justify-center">
              <div class="text-center">
                <h3 class="font-semibold text-lg mb-2">Right Panel</h3>
                <p class="text-sm text-gray-600">Try to drag beyond constraints</p>
              </div>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    direction: 'vertical',
    panelSizes: [50, 50],
    minSize: [25, 25],
    maxSize: [75, 75]
  }
};

export const InitialSizePixels = {
  render: (args) => ({
    components: { ResizableSplitter },
    setup() {
      return { args };
    },
    template: `
      <div style="height: 400px; border: 1px solid #e5e7eb; border-radius: 4px;">
        <ResizableSplitter v-bind="args">
          <template #panel-a>
            <div class="p-4 bg-orange-50 h-full flex items-center justify-center">
              <h3 class="font-semibold text-lg">Left Panel - 200px Initial</h3>
            </div>
          </template>
          <template #panel-b>
            <div class="p-4 bg-teal-50 h-full flex items-center justify-center">
              <h3 class="font-semibold text-lg">Right Panel - Remaining Space</h3>
            </div>
          </template>
        </ResizableSplitter>
      </div>
    `
  }),
  args: {
    direction: 'vertical',
    initialTopPanelPixels: 200
  }
};