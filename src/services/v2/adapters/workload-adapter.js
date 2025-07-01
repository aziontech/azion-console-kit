import {
  HTTP_PORT_LIST_OPTIONS,
  HTTPS_PORT_LIST_OPTIONS,
  HTTP3_PORT_LIST_OPTIONS,
  SUPPORTED_VERSIONS,
  TLS_VERSIONS_OPTIONS,
  SUPPORTED_CIPHERS_LIST_OPTIONS
} from '@/helpers'

const convertPortsArrayToIntegers = (ports) => {
  return ports.map((port) => parseInt(port.value))
}

const LOCKED_VALUE = 'custom'

const isLocked = (version) => version === LOCKED_VALUE

const parseName = ({ name, product_version }) => {
  const nameProps = { text: name, tagProps: {} }

  if (product_version === LOCKED_VALUE) {
    nameProps.tagProps = {
      icon: 'pi pi-lock',
      value: 'Locked',
      outlined: true,
      severity: 'warning'
    }
  }

  return nameProps
}

export const WorkloadAdapter = {
  transformCreateWorkload(payload) {
    let domains = payload.domains.map((domain) => `${domain.subdomain}.${domain.domain}`)
    if (payload.useCustomDomain) {
      domains.push(`${payload.customDomain}.azion.app`)
    }
    return {
      name: payload.name,
      edge_application: payload.edgeApplication || null,
      active: payload.active,
      infrastructure: payload.infrastructure,
      edge_firewall: payload.edgeFirewall || null,
      tls: {
        minimum_version: payload.tls.minimumVersion,
        ciphers: payload.tls.ciphers || null,
        certificate: payload.tls.certificate || null
      },
      protocols: {
        http: {
          versions: payload.protocols.http.useHttp3
            ? SUPPORTED_VERSIONS.withHttp3
            : SUPPORTED_VERSIONS.default,
          http_ports: convertPortsArrayToIntegers(payload.protocols.http.httpPorts),
          https_ports: payload.protocols.http.useHttps
            ? convertPortsArrayToIntegers(payload.protocols.http.httpsPorts)
            : null,
          quic_ports: payload.protocols.http.useHttp3
            ? convertPortsArrayToIntegers(payload.protocols.http.quicPorts)
            : null
        }
      },
      mtls: {
        verification: payload.mtls.verification || 'enforce',
        certificate: payload.mtls.certificate ?? null,
        crl: payload.mtls.crl || null
      },
      domains,
      workload_hostname_allow_access: payload.workloadHostnameAllowAccess
    }
  },
  transformListWorkloads(data) {
    return data.map((workload) => {
      const locked = isLocked(workload.product_version)

      return {
        id: workload.id,
        name: parseName(workload),
        isLocked: locked,
        disableEditClick: locked,
        lastModified: workload.last_modified
          ? new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
              new Date(workload.last_modified)
            )
          : '-',
        lastEditor: workload.last_editor,
        productVersion: workload.product_version,
        protocols: workload.protocols,
        infrastructure: workload.infrastructure === 1 ? 'Production' : 'Staging',
        active: workload.active
          ? { content: 'Active', severity: 'success' }
          : { content: 'Inactive', severity: 'danger' },
        workloadHostname: {
          content: workload.workload_domain
        },
        domains: workload.domains
      }
    })
  },
  transformLoadWorkload({ data: workload }) {
    return {
      id: workload.id,
      name: workload.name,
      active: workload.active,
      workloadHostname: workload.workload_hostname?.replace(/\.azion\.app$/, ''),
      domains: workload.alternate_domains?.length
        ? workload.alternate_domains.map((domain) => {
            const match = domain.match(/^(.+?)\.(.+)$/)
            return {
              subdomain: match ? match[1] : '',
              domain: match ? match[2] : domain
            }
          })
        : [{ subdomain: '', domain: '' }],
      optionsDomains: workload.alternate_domains?.map((domain) => {
        const match = domain.match(/^(.+?)\.(.+)$/)
        const domainValue = match ? match[2] : domain
        return {
          value: domainValue,
          label: domainValue
        }
      }),
      infrastructure: String(workload.infrastructure),
      workloadHostnameAllowAccess: workload.workload_hostname_allow_access,
      tls: {
        minimumVersion: workload.tls.minimum_version || TLS_VERSIONS_OPTIONS[1].value,
        ciphers: workload.tls.ciphers || SUPPORTED_CIPHERS_LIST_OPTIONS[0].value,
        certificate: workload.tls.certificate
      },
      protocols: {
        http: {
          useHttp3: workload.protocols.http.quic_ports !== null,
          useHttps: workload.protocols.http.https_ports !== null,
          httpPorts: workload.protocols.http.http_ports?.map((port) =>
            HTTP_PORT_LIST_OPTIONS.find((option) => option.value === port)
          ) || [HTTP_PORT_LIST_OPTIONS[0]],
          httpsPorts: workload.protocols.http.https_ports?.map((port) =>
            HTTPS_PORT_LIST_OPTIONS.find((option) => option.value === port)
          ) || [HTTPS_PORT_LIST_OPTIONS[0]],
          quicPorts: workload.protocols.http.quic_ports?.map((port) =>
            HTTP3_PORT_LIST_OPTIONS.find((option) => option.value === port)
          ) || [HTTP3_PORT_LIST_OPTIONS[0]]
        }
      },
      mtls: {
        isEnabled: !!workload?.mtls?.certificate,
        verification: workload.mtls.verification,
        certificate: workload.mtls.certificate,
        crl: workload.mtls.crl
      },
      isLocked: isLocked(workload.product_version)
    }
  }
}
