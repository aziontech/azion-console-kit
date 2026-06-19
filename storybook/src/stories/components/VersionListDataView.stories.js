import VersionListDataView from '@/components/VersionListDataView/index.vue';

export default {
  title: 'Components/VersionListDataView',
  component: VersionListDataView,
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description: 'Array of version items to render in the table rows'
    },
    columns: {
      control: 'object',
      description:
        'Column definitions ({ key, label, size, ... }). The default cells key off "version", "status" and "created".'
    },
    loading: {
      control: 'boolean',
      description: 'Shows the skeleton loading state'
    },
    isError: {
      control: 'boolean',
      description: 'Shows the error state (uses errorState for copy/action)'
    },
    hasVersions: {
      control: 'boolean',
      description:
        'Whether the resource has any versions at all. When false, the empty state is shown.'
    },
    emptyState: {
      control: 'object',
      description: 'Empty state content: { title, description, buttonLabel, buttonAction }'
    },
    errorState: {
      control: 'object',
      description: 'Error state content: { title, description, buttonLabel, buttonAction }'
    },
    searchTerm: {
      control: 'text',
      description: 'Current search term (v-model:searchTerm)'
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder for the search input'
    },
    filters: {
      control: 'object',
      description: 'Dropdown filter definitions rendered in the toolbar'
    },
    filterValues: {
      control: 'object',
      description: 'Current filter values keyed by filter key (v-model:filterValues)'
    },
    sort: {
      control: 'text',
      description: 'Current sort value (v-model:sort)'
    },
    sortOptions: {
      control: 'object',
      description: 'Options for the sort dropdown ({ label, value })'
    },
    showRowActions: {
      control: 'boolean',
      description: 'Whether the per-row overflow action button is rendered'
    },
    paginatorRows: {
      control: 'number',
      description: 'Rows per page in the paginator'
    },
    lazy: {
      control: 'boolean',
      description: 'Enables lazy (server-side) pagination using totalRecords'
    },
    totalRecords: {
      control: 'number',
      description: 'Total record count used when lazy is true'
    },
    filteredEmptyTitle: {
      control: 'text',
      description: 'Title shown when there are versions but filters/search hide them all'
    },
    filteredEmptyDescription: {
      control: 'text',
      description: 'Description shown for the filtered-empty state'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A responsive, DataView-based table for listing resource versions. Renders five mutually exclusive states (loading, error, empty, filtered-empty, table), a search/filter/sort toolbar, and an optional per-row actions menu. The default "version" cell shows the version hash, a state status tag, a "Current" marker for the active version, and an optional comment; the default "created" cell shows the formatted date and the (masked) last editor.'
      }
    }
  }
};

const columns = [
  { key: 'version', label: 'Version', size: 'minmax(220px, 1.4fr)' },
  { key: 'status', label: 'Status', size: 'minmax(140px, 0.8fr)' },
  { key: 'created', label: 'Created', size: 'minmax(180px, 1.2fr)' }
];

const sampleVersions = [
  {
    id: 'v-1042',
    state: 'active',
    comment: 'Production rollout for the new origin shield',
    createdAt: '2026-06-12T14:32:00Z',
    lastEditor: 'maria.silva@azion.com'
  },
  {
    id: 'v-1041',
    state: 'ready',
    comment: 'Tuned cache TTLs for static assets',
    createdAt: '2026-06-10T09:15:00Z',
    lastEditor: 'joao.pereira@azion.com'
  },
  {
    id: 'v-1040',
    state: 'building',
    comment: 'Adding rules engine behaviors',
    createdAt: '2026-06-09T18:47:00Z'
  },
  {
    id: 'v-1039',
    state: 'draft',
    comment: 'WIP: experimenting with device groups',
    createdAt: '2026-06-08T11:05:00Z',
    lastEditor: 'ana.costa@azion.com'
  },
  {
    id: 'v-1038',
    state: 'error',
    comment: 'Build failed during function deploy',
    createdAt: '2026-06-07T16:20:00Z',
    lastEditor: 'lucas.lima@azion.com'
  },
  {
    id: 'v-1037',
    state: 'archived',
    comment: '',
    createdAt: '2026-06-01T08:00:00Z',
    lastEditor: 'maria.silva@azion.com'
  }
];

const sortOptions = [
  { label: 'Newest first', value: 'created:desc' },
  { label: 'Oldest first', value: 'created:asc' }
];

const filters = [
  {
    key: 'state',
    placeholder: 'State',
    options: [
      { label: 'All states', value: '' },
      { label: 'Draft', value: 'draft' },
      { label: 'Building', value: 'building' },
      { label: 'Ready', value: 'ready' },
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' },
      { label: 'Error', value: 'error' }
    ]
  }
];

export const Default = {
  args: {
    items: sampleVersions,
    columns,
    hasVersions: true,
    loading: false,
    isError: false,
    searchTerm: '',
    searchPlaceholder: 'Search versions',
    filters,
    filterValues: { state: '' },
    sort: 'created:desc',
    sortOptions,
    showRowActions: true,
    paginatorRows: 20
  }
};

export const Loading = {
  args: {
    items: [],
    columns,
    hasVersions: true,
    loading: true,
    sortOptions
  }
};

export const Empty = {
  args: {
    items: [],
    columns,
    hasVersions: false,
    loading: false,
    isError: false,
    emptyState: {
      title: 'No versions yet',
      description: 'Create your first version to start tracking changes to this resource.',
      buttonLabel: 'Create version'
    }
  }
};

export const FilteredEmpty = {
  args: {
    items: [],
    columns,
    hasVersions: true,
    loading: false,
    isError: false,
    searchTerm: 'rollback',
    filters,
    filterValues: { state: 'archived' },
    sort: 'created:desc',
    sortOptions,
    filteredEmptyTitle: 'No versions match your filters',
    filteredEmptyDescription: 'Try clearing the search term or selecting a different state.'
  }
};

export const Error = {
  args: {
    items: [],
    columns,
    hasVersions: true,
    loading: false,
    isError: true,
    errorState: {
      title: 'Could not load versions',
      description: 'Something went wrong while fetching the version history. Please try again.',
      buttonLabel: 'Retry'
    }
  }
};

export const NoRowActions = {
  args: {
    items: sampleVersions,
    columns,
    hasVersions: true,
    loading: false,
    isError: false,
    showRowActions: false,
    filters,
    filterValues: { state: '' },
    sort: 'created:desc',
    sortOptions,
    paginatorRows: 20
  }
};
