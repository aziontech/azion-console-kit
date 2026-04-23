import AdvancedFilterSystem from '@/components/base/advanced-filter-system/index.vue';

export default {
  title: 'Components/Base/AdvancedFilterSystem',
  component: AdvancedFilterSystem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Advanced filtering system component that provides date range selection and field-based filtering capabilities. This component integrates with the application store and requires account context for timezone handling.'
      }
    }
  }
};

export const Default = {
  render: () => ({
    template: `
      <div class="p-4">
        <p class="text-sm text-gray-600">
          The AdvancedFilterSystem component is a complex filtering interface that requires:
        </p>
        <ul class="list-disc list-inside mt-2 text-sm text-gray-600">
          <li>Account store context for timezone information</li>
          <li>Field definitions for available filters</li>
          <li>Date range configuration</li>
        </ul>
        <p class="text-sm text-gray-600 mt-2">
          Due to these dependencies, a full demonstration requires the application context.
          Use this component in your application where the store and services are available.
        </p>
      </div>
    `
  })
};