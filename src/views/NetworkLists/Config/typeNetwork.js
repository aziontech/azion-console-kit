import { ref } from 'vue'

export const networkGrouRadio = ref([
  {
    title: 'ASN',
    subtitle:
      'An Autonomous System Number (ASN) uniquely identifies a network on the Internet. Enter one ASN per line (e.g., 13335).',
    inputValue: 'asn',
    disabled: false,
    tag: null
  },
  {
    title: 'IP/CIDR',
    subtitle:
      'An IP Address or CIDR uniquely identifies a network on the Internet. Enter one IP Address or CIDR per line (e.g., 192.168.1.1/24).',
    inputValue: 'ip_cidr',
    disabled: false,
    tag: null
  },
  {
    title: 'Countries',
    subtitle: 'Select one or more countries to build a geolocation-based list.',
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
