import InfoBanner from '@/templates/info-banner/index.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useInfoBannerStore } from '@/stores/info-banner';

export default {
  title: 'Templates/InfoBanner',
  component: InfoBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `A banner notification component that displays messages from the InfoBanner Pinia store.

**Features:**
- Displays multiple banners with animated entry/exit
- Three severity types: info, warning, error
- Uses Motion V for animations
- Managed via \`useInfoBannerStore()\` actions

**Usage:**
\`\`\`javascript
const store = useInfoBannerStore()
store.show({
  id: 'unique-id',
  severity: 'info', // or 'warning', 'error'
  content: '<strong>Bold</strong> message with HTML support'
})
\`\`\`

**Store Actions:**
- \`show({ id, severity, content })\`: Display a banner
- \`hide(id)\`: Hide a specific banner
- \`clear()\`: Remove all banners`
      }
    }
  }
};

// Helper wrapper component that initializes the Pinia store
const InfoBannerWrapper = {
  components: { InfoBanner },
  props: {
    banners: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    // Initialize Pinia for this story instance
    setActivePinia(createPinia());
    const store = useInfoBannerStore();

    // Add banners from props
    props.banners.forEach((banner) => {
      store.show(banner);
    });

    return {};
  },
  template: '<InfoBanner />'
};

export const Default = {
  render: () => ({
    components: { InfoBannerWrapper },
    setup() {
      return {};
    },
    template: `
      <InfoBannerWrapper :banners="[
        { id: 'info-1', severity: 'info', content: '<strong>Information:</strong> This is an informational banner message.' }
      ]" />
    `
  })
};

export const Warning = {
  render: () => ({
    components: { InfoBannerWrapper },
    setup() {
      return {};
    },
    template: `
      <InfoBannerWrapper :banners="[
        { id: 'warning-1', severity: 'warning', content: '<strong>Warning:</strong> Please review this important information carefully.' }
      ]" />
    `
  })
};

export const Error = {
  render: () => ({
    components: { InfoBannerWrapper },
    setup() {
      return {};
    },
    template: `
      <InfoBannerWrapper :banners="[
        { id: 'error-1', severity: 'error', content: '<strong>Error:</strong> An error has occurred. Please try again.' }
      ]" />
    `
  })
};

export const MultipleBanners = {
  render: () => ({
    components: { InfoBannerWrapper },
    setup() {
      return {};
    },
    template: `
      <InfoBannerWrapper :banners="[
        { id: 'info-1', severity: 'info', content: '<strong>Info:</strong> Your changes have been saved automatically.' },
        { id: 'warning-1', severity: 'warning', content: '<strong>Warning:</strong> Your session will expire in 5 minutes.' },
        { id: 'error-1', severity: 'error', content: '<strong>Error:</strong> Failed to load some resources.' }
      ]" />
    `
  })
};

export const InteractiveControl = {
  render: () => ({
    components: { InfoBannerWrapper },
    setup() {
      const addInfo = () => {
        setActivePinia(createPinia());
        const store = useInfoBannerStore();
        store.show({
          id: 'interactive-info',
          severity: 'info',
          content: 'Interactive info banner added!'
        });
      };

      return { addInfo };
    },
    template: `
      <div class="space-y-4">
        <div class="flex gap-2">
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded"
            @click="addInfo"
          >
            Add Info Banner
          </button>
        </div>
        <InfoBannerWrapper :banners="[]" />
      </div>
    `
  })
};
