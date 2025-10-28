import {
  HTTP_PORT_LIST_OPTIONS,
  HTTPS_PORT_LIST_OPTIONS,
  HTTP3_PORT_LIST_OPTIONS,
  SUPPORTED_VERSIONS,
  SUPPORTED_CIPHERS_LIST_OPTIONS
} from '@/helpers'
import { getPrimaryDomain } from '@/services/v2/utils/adapter/domainAdapter'
import { convertToRelativeTime } from '@/helpers/convert-date'

const convertPortsArrayToIntegers = (ports) => {
  return ports.map((port) => parseInt(port.value))
}

function extractAzionAppSubdomain(fullDomains) {
  const cleanDomains = []
  let azionAppSubdomains = ''

  fullDomains.forEach((full) => {
    const { domain, subdomain } = getPrimaryDomain(full)

    if (domain === 'azion.app') {
      azionAppSubdomains = subdomain
    } else {
      cleanDomains.push({ subdomain: subdomain ?? '', domain })
    }
  })

  return {
    cleanDomains: cleanDomains.length ? cleanDomains : [{ subdomain: '', domain: '' }],
    azionAppSubdomains
  }
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

const handleTls = (payload) => {
  if (payload.protocols.http.useHttps) {
    return {
      minimum_version: payload.tls.minimumVersion || null,
      ciphers: payload.tls.ciphers || null,
      certificate: payload.tls.certificate || null
    }
  }

  return null
}

export const WorkloadAdapter = {
  transformCreateWorkload(payload) {
    let domains = payload.domains
      .filter(({ subdomain, domain }) => subdomain || domain)
      .map(({ subdomain, domain }) => (subdomain ? `${subdomain}.${domain}` : domain))

    if (payload.useCustomDomain) {
      domains.unshift(`${payload.customDomain}.azion.app`)
    }

    const payloadResquest = {
      name: payload.name,
      active: payload.active,
      infrastructure: payload.infrastructure,
      tls: handleTls(payload),
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
        verification: payload.mtls.verification,
        certificate: payload.mtls.certificate ?? null,
        crl: payload.mtls.crl || null
      },
      domains,
      workload_hostname_allow_access: payload.workloadHostnameAllowAccess
    }

    if (!payload.mtls.isEnabled) {
      delete payloadResquest.mtls
    }
    if (payloadResquest.tls === null) {
      delete payloadResquest.tls
      delete payloadResquest.protocols.http.https_ports
    }

    return payloadResquest
  },
  transformListWorkloads(data) {
    return data.map((workload) => {
      const locked = isLocked(workload.product_version)

      return {
        id: workload.id,
        name: parseName(workload),
        isLocked: locked,
        disableEditClick: locked,
        lastModify: convertToRelativeTime(workload.last_modified),
        lastModified: workload.last_modified,
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
  transformLoadWorkload({ data: workload }, workloadDeployment) {
    const { azionAppSubdomains, cleanDomains } = extractAzionAppSubdomain(workload.domains)
    return {
      id: workload.id,
      name: workload.name,
      active: workload.active,
      workloadHostname: workload.workload_domain?.replace(/\.azion\.app$/, ''),
      workloadDeploymentId: workloadDeployment?.id,
      application: workloadDeployment?.application,
      firewall: workloadDeployment?.firewall,
      customPage: workloadDeployment?.customPage,
      domains: cleanDomains,
      customDomain: azionAppSubdomains,
      useCustomDomain: !!azionAppSubdomains,
      infrastructure: String(workload.infrastructure),
      workloadHostnameAllowAccess: workload.workload_domain_allow_access,
      tls: {
        minimumVersion: workload.tls.minimum_version,
        ciphers: workload.tls.ciphers || SUPPORTED_CIPHERS_LIST_OPTIONS[0].value,
        certificate: workload.tls.certificate || 0
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
        verification: workload.mtls.verification?.toLowerCase() || null,
        certificate: workload.mtls.certificate,
        crl: workload.mtls.crl
      },
      isLocked: isLocked(workload.product_version)
    }
  }
}
