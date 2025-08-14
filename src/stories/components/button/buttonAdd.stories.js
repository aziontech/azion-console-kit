import ButtonAdd from '../../../components/button-add'

export default {
  title: 'Components/ButtonAdd',
  component: ButtonAdd,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      description: 'Icon class string. Example: pi pi-check',
      options: ['pi pi-plus', 'pi pi-plus-circle'],
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
    icon: 'pi pi-plus',
    severity: 'primary',
    size: 'normal'
  }
}
