import { ref } from 'vue'

export const networkGrouRadio = ref([
  {
    title: 'ASN',
    subtitle:
      'Identify networks using Autonomous System Numbers (ASNs). Ideal for traffic grouping.',
    inputValue: 'asn',
    disabled: false
  },
  {
    title: 'IP/CIDR',
    subtitle:
      'Define specific IP addresses or ranges using CIDR notation. Ideal for precise traffic segmentation.',
    inputValue: 'ip_cidr',
    disabled: false
  },
  {
    title: 'Countries',
    subtitle: 'Group traffic based on geographic regions or countries. Simplifies location-based configurations.',
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
