import { ref } from 'vue'

export const networkGrouRadio = ref([
  {
    title: 'ASN',
    subtitle:
      'An Autonomous System Number (ASN) uniquely identifies a network on the Internet. Enter one ASN per line (e.g., 13335).',
    inputValue: 'asn',
    disabled: false
  },
  {
    title: 'IP/CIDR',
    subtitle:
      'An IP Address or CIDR uniquely identifies a network on the Internet. Enter one IP Address or CIDR per line (e.g., 192.168.1.1/24).',
    inputValue: 'ip_cidr',
    disabled: false
  },
  {
    title: 'Countries',
    subtitle: 'Select one or more countries to build a geolocation-based list.',
    inputValue: 'countries',
    disabled: false
  }
])

export const handleTypeNetwork = (isEditPage = false) => {
  if (isEditPage) {
    return networkGrouRadio.value.map((item) => {
      return {
        ...item,
        disabled: true
      }
    })
  }

  return networkGrouRadio.value
}
