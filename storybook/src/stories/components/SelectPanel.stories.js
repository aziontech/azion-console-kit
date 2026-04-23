import SelectPanel from '@/components/select-panel/selectPanel.vue';
import { ref } from 'vue';

export default {
  title: 'Components/SelectPanel',
  component: SelectPanel,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text displayed above the select button'
    },
    description: {
      control: 'text',
      description: 'Description text displayed below the title'
    },
    options: {
      control: 'object',
      description: 'Array of options for the select button (simple strings or objects with label/value)'
    },
    value: {
      control: 'text',
      description: 'Initial selected value'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A panel component that combines a title, description, and a select button. Emits update:modelValue when selection changes. Can display additional content via the content slot.'
      }
    }
  }
};

export const Default = {
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      const selectedValue = ref(args.value);
      return { args, selectedValue };
    },
    template: `
      <SelectPanel
        v-bind="args"
        v-model="selectedValue"
      >
        <template #content>
          <div class="p-6 border rounded-lg bg-surface-50">
            <div class="flex items-center gap-3">
              <div class="text-2xl">
                {{ selectedValue === 'Grid' ? '📊' : selectedValue === 'List' ? '📝' : '📋' }}
              </div>
              <div>
                <div class="font-semibold text-gray-800 text-lg">{{ selectedValue }} View</div>
                <div class="text-sm text-gray-600">
                  {{ selectedValue === 'Grid' ? 'Visual card-based layout' : selectedValue === 'List' ? 'Compact row display' : 'Detailed columnar format' }}
                </div>
              </div>
            </div>
          </div>
        </template>
      </SelectPanel>
    `
  }),
  args: {
    title: 'View Mode',
    description: 'Select how you want to view your data',
    options: ['Grid', 'List', 'Table'],
    value: 'Grid'
  }
};

export const WithoutContent = {
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      const selectedValue = ref(args.value);
      return { args, selectedValue };
    },
    template: `
      <SelectPanel
        v-bind="args"
        v-model="selectedValue"
      />
    `
  }),
  args: {
    title: 'Sort Order',
    description: 'Choose how to sort the items',
    options: ['Ascending', 'Descending'],
    value: 'Ascending'
  }
};

export const NoTitleDescription = {
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      const selectedValue = ref(args.value);
      return { args, selectedValue };
    },
    template: `
      <SelectPanel
        v-bind="args"
        v-model="selectedValue"
      />
    `
  }),
  args: {
    title: '',
    description: '',
    options: ['Option 1', 'Option 2', 'Option 3'],
    value: 'Option 1'
  }
};

export const EdgeFunctionStyle = {
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      const selectedValue = ref(args.value);
      return { args, selectedValue };
    },
    template: `
      <SelectPanel
        v-bind="args"
        v-model="selectedValue"
      >
        <template #content>
          <div class="border rounded-lg overflow-hidden">
            <div class="p-4 bg-surface-50 border-b">
              <div class="text-sm font-medium text-gray-700 mb-1">{{ selectedValue }} Editor</div>
              <div class="text-xs text-gray-500">
                {{ selectedValue === 'Form' ? 'Configure using the visual form builder' : 'Edit raw JSON configuration' }}
              </div>
            </div>
            <div class="p-4 min-h-[200px] bg-white">
              <div v-if="selectedValue === 'Form'" class="space-y-3">
                <div class="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div class="text-sm font-medium text-blue-800">Form Builder</div>
                  <div class="text-xs text-blue-600 mt-1">Visual configuration interface</div>
                </div>
              </div>
              <div v-else class="space-y-3">
                <div class="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-xs">
                  <div class="text-gray-800">{</div>
                  <div class="text-gray-600 pl-2">"args": "your_config"</div>
                  <div class="text-gray-800">}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </SelectPanel>
    `
  }),
  args: {
    title: 'Arguments',
    description: 'Configure the function arguments to customize its behavior.',
    options: ['Form', 'JSON'],
    value: 'Form'
  }
};