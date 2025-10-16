import { ref } from 'vue'

export const networkGrouRadio = ref([
  {
    title: 'ASN',
    subtitle:
      'Identify networks using Autonomous System Numbers (ASNs). Ideal for traffic grouping.',
    inputValue: 'asn',
    disabled: false,
    tag: null
  },
  {
    title: 'IP/CIDR',
    subtitle:
      'Define specific IP addresses or ranges using CIDR notation. Ideal for precise traffic segmentation.',
    inputValue: 'ip_cidr',
    disabled: false,
    tag: null
  },
  {
    title: 'Countries',
    subtitle:
      'Group traffic based on geographic regions or countries. Simplifies location-based configurations.',
    inputValue: 'countries',
    disabled: false,
    tag: null
  }
])

const TAG_LOCK = {
  value: 'The type cannot be changed after the network list is created',
  icon: 'pi pi-lock'
}

export const handleTypeNetwork = (isEditPage = false, typeNetworkSelected = '') => {
  if (isEditPage) {
    return networkGrouRadio.value.map((item) => {
      const isSelected = item.inputValue === typeNetworkSelected
      return {
        ...item,
        disabled: true,
        tag: isSelected ? TAG_LOCK : item.tag
      }
    })
  }

  return networkGrouRadio.value
}
