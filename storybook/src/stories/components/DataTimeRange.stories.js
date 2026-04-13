import DataTimeRange from '@/components/base/dataTimeRange/index.vue';

export default {
  title: 'Components/Base/DataTimeRange',
  component: DataTimeRange,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Date and time range picker component with quick select options and absolute/relative date modes. Provides an overlay panel with tabbed interface for different selection modes.'
      }
    }
  }
};

export const Default = {
  render: () => ({
    template: `
      <div class="p-4">
        <p class="text-sm text-gray-600">
          The DataTimeRange component provides a sophisticated date/time range selection interface with:
        </p>
        <ul class="list-disc list-inside mt-2 text-sm text-gray-600">
          <li>Quick select presets (Today, Last 7 days, etc.)</li>
          <li>Absolute date range picker with calendar</li>
          <li>Relative date range picker (e.g., "last 2 hours")</li>
          <li>Auto-refresh capabilities</li>
        </ul>
        <p class="text-sm text-gray-600 mt-2">
          This component requires proper timezone context from the account store for accurate date handling.
          Use in application context where store dependencies are available.
        </p>
      </div>
    `
  })
};