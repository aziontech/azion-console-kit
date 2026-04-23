import ListTableSimple from '@/components/list-table/ListTableSimple.vue';

export default {
  title: 'Components/ListTableSimple',
  component: ListTableSimple,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of data objects to display in the table'
    },
    columns: {
      control: 'object',
      description: 'Column definitions with field, header, and optional style/sortable properties'
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state'
    },
    rowsLimit: {
      control: 'number',
      description: 'Maximum number of rows to display'
    },
    viewAllLabel: {
      control: 'text',
      description: 'Label for the "View all" footer link'
    },
    dataKey: {
      control: 'text',
      description: 'Property name to use as unique key for each row'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A simplified table component for displaying a limited number of rows with optional actions. Ideal for dashboards and summary views where you want to show recent items with a link to the full list.'
      }
    }
  }
};

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', role: 'Admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', role: 'User' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', role: 'User' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', status: 'Active', role: 'Editor' },
  { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', status: 'Pending', role: 'User' }
];

const sampleColumns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'email', header: 'Email' },
  { field: 'status', header: 'Status', sortable: true },
  { field: 'role', header: 'Role' }
];

export const Default = {
  args: {
    data: sampleData,
    columns: sampleColumns,
    rowsLimit: 5,
    dataKey: 'id'
  }
};

export const WithViewAllLink = {
  args: {
    data: sampleData,
    columns: sampleColumns,
    rowsLimit: 3,
    viewAllLink: '/users',
    viewAllLabel: 'View all users...',
    dataKey: 'id'
  }
};

export const Loading = {
  args: {
    data: [],
    columns: sampleColumns,
    loading: true,
    rowsLimit: 5,
    dataKey: 'id'
  }
};

export const LimitedRows = {
  args: {
    data: sampleData,
    columns: sampleColumns,
    rowsLimit: 3,
    dataKey: 'id'
  }
};

export const WithCustomColumnWidths = {
  args: {
    data: sampleData,
    columns: [
      { field: 'name', header: 'Name', style: 'width: 200px' },
      { field: 'email', header: 'Email', style: 'width: 250px' },
      { field: 'status', header: 'Status', style: 'width: 100px' },
      { field: 'role', header: 'Role', style: 'width: 100px' }
    ],
    rowsLimit: 5,
    dataKey: 'id'
  }
};