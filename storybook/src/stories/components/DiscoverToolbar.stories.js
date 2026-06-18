import DiscoverToolbar from '@/views/RealTimeEvents/Blocks/components/discover-toolbar.vue';

export default {
  title: 'Components/RealTimeEvents/DiscoverToolbar',
  component: DiscoverToolbar,
  tags: ['autodocs'],
  argTypes: {
    sidebarVisible: { control: 'boolean' },
    recordsFound: { control: 'text' },
    documentSearchQuery: { control: 'text' },
    detailViewMode: {
      control: { type: 'select' },
      options: ['inline', 'sidebar']
    },
    isFullscreen: { control: 'boolean' },
    pageSize: { control: 'number' },
    pageSizeOptions: { control: 'object' },
    exportMenuItems: { control: 'object' }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Toolbar above the RealTimeEvents discover table. Hosts the document-search input, detail-view toggles, fullscreen toggle, page-size selector, GraphQL playground link, and export menu. Layout must stay readable from 360px to 1920px.'
      }
    }
  }
};

const baseArgs = {
  sidebarVisible: true,
  recordsFound: '1,248',
  documentSearchQuery: 'status:200 AND host:"example.com"',
  detailViewMode: 'inline',
  isFullscreen: false,
  pageSize: 50,
  pageSizeOptions: [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '250', value: 250 }
  ],
  exportMenuItems: [
    { label: 'Export as CSV', icon: 'pi pi-file' },
    { label: 'Export as JSON', icon: 'pi pi-file-export' },
    { label: 'Copy to clipboard', icon: 'pi pi-copy' }
  ]
};

const renderAtWidth = (width) => (args) => ({
  components: { DiscoverToolbar },
  setup() {
    return { args };
  },
  template: `
    <div :style="{ width: '${width}px', maxWidth: '100%', border: '1px dashed rgba(255,255,255,0.18)', padding: '0.5rem' }">
      <DiscoverToolbar v-bind="args" />
    </div>
  `
});

export const Mobile_360 = {
  args: { ...baseArgs },
  render: renderAtWidth(360),
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: { description: { story: 'Toolbar rendered at 360px (mobile). Search input is hidden by the existing 900px breakpoint; export and page-size remain visible.' } }
  }
};

export const Tablet_768 = {
  args: { ...baseArgs },
  render: renderAtWidth(768),
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: { description: { story: 'Toolbar at 768px (tablet). Compact layout with hidden secondary buttons via the 1100px breakpoint.' } }
  }
};

export const LegacyDesktop_1100 = {
  args: { ...baseArgs },
  render: renderAtWidth(1100),
  parameters: {
    docs: { description: { story: 'Toolbar at 1100px (legacy desktop). Search shrinks to flex 0 1 10rem; sidebar/playground buttons hide.' } }
  }
};

export const Desktop_1280 = {
  args: { ...baseArgs },
  render: renderAtWidth(1280),
  parameters: {
    docs: { description: { story: 'Toolbar at 1280px (standard desktop). Search wrapper sits at flex 0 1 14rem; all controls visible.' } }
  }
};

export const WideDesktop_1920 = {
  args: { ...baseArgs },
  render: renderAtWidth(1920),
  parameters: {
    docs: { description: { story: 'Toolbar at 1920px (wide desktop). Search width capped at 14rem (max-width) so it cannot dominate the available space.' } }
  }
};
