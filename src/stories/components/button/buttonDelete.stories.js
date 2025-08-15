import ButtonDelete from '../../../components/button-delete'

export default {
  title: 'Components/buttons/ButtonDelete',
  component: ButtonDelete,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      description: 'Icon class string. Example: pi pi-trash',
      options: ['pi pi-trash', 'pi pi-delete-left', 'pi pi-times', 'pi pi-times-circle'],
      control: { type: 'select' }
    },
    iconPos: {
      description: 'Define icon position',
      options: ['left', 'right'],
      control: { type: 'select' }
    },
    outlined: {
      description: 'Outlined buttons display a border without a background initially.'
    },
    severity: {
      description: 'The severity property defines the variant of a button.',
      options: ['primary', 'secondary', 'info', 'success', 'warning', 'danger'],
      control: { type: 'select' }
    },
    size: {
      description: 'The size property defines the size of a button.',
      options: ['small', 'normal', 'large'],
      control: { type: 'select' }
    }
  }
}

export const Default = {
  args: {
    dataTestId: '',
    label: '',
    outlined: false,
    iconPos: 'left',
    icon: 'pi pi-trash',
    severity: 'primary',
    size: 'normal'
  }
}
