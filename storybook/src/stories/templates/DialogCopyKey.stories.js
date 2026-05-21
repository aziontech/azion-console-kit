import DialogCopyKey from '@/templates/dialog-copy-key/index.vue'
import { ref, provide } from 'vue'

export default {
  title: 'Templates/DialogCopyKey',
  component: DialogCopyKey,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A dialog component that displays a token/key value with copy functionality and a warning message. Uses Dialog with either InputPassword (with toggle mask) or InputText based on the mask parameter. Receives the token via dialogRef injection. Designed to be used with PrimeVue dynamic dialog systems. Supports both Personal Tokens and Origin Keys with configurable masking behavior. The token is displayed once with a warning to copy it before closing.'
      }
    }
  }
}

// Helper component to provide dialogRef injection
const DialogWrapper = {
  components: { DialogCopyKey },
  props: {
    token: {
      type: String,
      default: 'ec7dfefb-c7c4-429e-b4ab-bc952f6176b3'
    },
    title: {
      type: String,
      default: 'Origin Key'
    },
    mask: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const dialogData = ref({
      token: props.token,
      title: props.title,
      mask: props.mask
    });

    const dialogRef = ref({
      data: dialogData.value,
      close: () => {
        // eslint-disable-next-line no-console
        console.log('Dialog closed');
      }
    });

    provide('dialogRef', dialogRef);

    return {};
  },
  template: `
    <DialogCopyKey />
  `
}

export const Default = {
  render: () => ({
    components: { DialogWrapper },
    template: '<DialogWrapper token="ec7dfefb-c7c4-429e-b4ab-bc952f6176b3" title="Origin Key" :mask="false" />'
  })
}

export const PersonalToken = {
  render: () => ({
    components: { DialogWrapper },
    template: '<DialogWrapper token="azion34c675c8ee426a6830807bbfff0dddb0f42" title="Personal Token" :mask="true" />'
  })
}