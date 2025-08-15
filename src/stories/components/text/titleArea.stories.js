import TitleArea from '../../../components/title-area'

export default {
  title: 'Components/text/titleArea',
  component: TitleArea,
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Title text'
    }
  }
}

export const Default = {
  args: {
    title: 'My Title Area'
  }
}
