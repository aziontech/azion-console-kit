import SelectPanel from '../../components/select-panel'
import { ref } from 'vue'

export default {
  title: 'Components/SelectPanel',
  component: SelectPanel,
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Title text for the panel'
    },
    description: {
      description: 'Description text for the panel'
    },
    options: {
      description: 'Array of options for the select button',
      control: { type: 'object' }
    },
    value: {
      description: 'Selected value'
    }
  }
}

export const Default = {
  args: {
    title: 'Select Panel Title',
    description: 'This is a description for the select panel component',
    options: ['Form', 'JSON'],
    value: 'Form'
  },
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      return { args }
    },
    template: `
      <SelectPanel v-bind="args">
        <template #content>
          <div class="p-4 bg-gray-50 rounded-md">
            <p>This is the content slot area. You can place any content here based on the selected option.</p>
          </div>
        </template>
      </SelectPanel>
    `
  })
}

export const WithoutContent = {
  args: {
    title: 'Simple Select Panel',
    description: 'A select panel without content slot',
    options: ['Development', 'Staging', 'Production'],
    value: 'Development'
  }
}

export const LongDescription = {
  args: {
    title: 'Configuration Panel',
    description:
      'This is a longer description that explains the purpose of this select panel and provides more context about what the user should expect when making a selection.',
    options: ['Basic', 'Advanced', 'Expert'],
    value: 'Basic'
  },
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      return { args }
    },
    template: `
      <SelectPanel v-bind="args">
        <template #content>
          <div class="p-4 border border-gray-200 rounded-md">
            <h4 class="font-semibold mb-2">Selected: {{ args.value }}</h4>
            <p>Content changes based on the selected option above.</p>
          </div>
        </template>
      </SelectPanel>
    `
  })
}

export const FormJsonExample = {
  args: {
    title: 'Arguments',
    description: 'Configure the function arguments to customize its behavior.',
    options: ['Form', 'JSON'],
    value: 'Form'
  },
  render: (args) => ({
    components: { SelectPanel },
    setup() {
      const selectedValue = ref(args.value)

      return {
        args,
        selectedValue
      }
    },
    template: `
      <SelectPanel 
        v-bind="args" 
        :value="selectedValue"
        @update:modelValue="selectedValue = $event"
      >
        <template #content>
          <div v-show="selectedValue === 'Form'" class="p-4 border border-gray-200 rounded-md">
            <h4 class="font-semibold mb-4">Form Builder</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Name</label>
                <input type="text" class="w-full p-2 border rounded-md" placeholder="Enter name" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Value</label>
                <input type="text" class="w-full p-2 border rounded-md" placeholder="Enter value" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Description</label>
                <textarea class="w-full p-2 border rounded-md" rows="3" placeholder="Enter description"></textarea>
              </div>
            </div>
          </div>
          <div v-show="selectedValue === 'JSON'" class="p-4 border border-gray-200 rounded-md">
            <h4 class="font-semibold mb-4">JSON Editor</h4>
            <div class="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm">
              <pre>
              {
                "name": "example",
                "value": "test",
                "description": "Sample JSON configuration",
                "enabled": true,
                "options": {
                  "timeout": 30,
                  "retries": 3
                }
              }</pre>
            </div>
            <p class="text-sm text-gray-600 mt-2">
              Customize the arguments in JSON format. Once set, they can be called in code using <code class="bg-gray-100 px-1 rounded">event.args('arg_name')</code>.
            </p>
          </div>
        </template>
      </SelectPanel>
    `
  })
}
