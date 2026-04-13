import DialogOnboardingScheduling from '@/templates/dialogs-block/dialog-onboarding-scheduling.vue';
import { ref, provide } from 'vue';

// Wrapper component to provide dialogRef injection
const DialogOnboardingSchedulingWrapper = {
  components: { DialogOnboardingScheduling },
  setup() {
    // Create dialogRef that mimics PrimeVue's dynamic dialog
    const dialogRef = ref({
      data: {},
      close: () => {
        // eslint-disable-next-line no-console
        console.log('Dialog closed');
      }
    });

    // Provide the injection
    provide('dialogRef', dialogRef);

    return {};
  },
  template: '<DialogOnboardingScheduling />'
};

export default {
  title: 'Templates/DialogOnboardingScheduling',
  component: DialogOnboardingScheduling,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `A modal dialog for scheduling onboarding sessions with an Azion expert.

**Features:**
- Modal dialog with fixed header
- Two action buttons: "Remind Later" and "Schedule Now"
- "Schedule Now" opens external onboarding scheduler
- "Remind Later" closes the dialog
- Non-closable (no X button)

**Use Case:**
Displayed to new users to encourage them to book an onboarding session with an Azion expert for personalized guidance and support.

**Dependencies:**
- Requires \`dialogRef\` injection from PrimeVue Dynamic Dialogs
- Uses Vue Router for navigation
- Uses \`azionOnboardingWindowOpener\` helper to open external scheduler`
      }
    }
  }
};

export const Default = {
  render: () => ({
    components: { DialogOnboardingSchedulingWrapper },
    template: '<DialogOnboardingSchedulingWrapper />'
  })
};