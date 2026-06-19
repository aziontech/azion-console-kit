import {
  HTTP_PORT_LIST_OPTIONS,
  HTTPS_PORT_LIST_OPTIONS,
  HTTP3_PORT_LIST_OPTIONS,
  SUPPORTED_VERSIONS,
  SUPPORTED_CIPHERS_LIST_OPTIONS
} from '@/helpers'
import { getPrimaryDomain } from '@/services/v2/utils/adapter/domainAdapter'
import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

const convertPortsArrayToIntegers = (ports) => {
  return ports.map((port) => parseInt(port.value))
}

function buildV6CleanDomains(fullDomains, zones = []) {
  const cleanDomains = fullDomains.map((entry) => {
    const name = typeof entry === 'string' ? entry : entry?.name
    const environment = typeof entry === 'string' ? null : (entry?.environment ?? null)
    const certificate = typeof entry === 'string' ? null : (entry?.certificate ?? null)
    const { domain, subdomain } = getPrimaryDomain(name, zones)

    return { subdomain: subdomain ?? '', domain, environment, certificate }
  })

  return cleanDomains.length
    ? cleanDomains
    : [{ subdomain: '', domain: '', environment: null, certificate: 0 }]
}

function extractAzionAppSubdomainLegacy(fullDomains, zones = []) {
  const cleanDomains = []
  let azionAppSubdomains = ''

  fullDomains.forEach((full) => {
    const { domain, subdomain } = getPrimaryDomain(full, zones)

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
      ciphers: payload.tls.ciphers || null
    }
  }

  return null
}

const handleTlsLegacy = (payload) => {
  if (payload.protocols.http.useHttps) {
    return {
      minimum_version: payload.tls.minimumVersion || null,
      ciphers: payload.tls.ciphers || null,
      certificate: payload.tls.certificate || null
    }
  }

  return null
}

const buildV6DomainEntries = (payload) => {
  return payload.domains
    .filter(({ subdomain, domain }) => subdomain || domain)
    .map(({ subdomain, domain, environment }) => ({
      name: subdomain ? `${subdomain}.${domain}` : domain,
      environment: environment ?? null
    }))
}

const buildV6Bindings = (entries, environmentDeployments = {}) => {
  const domainsByEnvironment = new Map()

  for (const { name, environment } of entries) {
    if (environment == null) continue
    if (!domainsByEnvironment.has(environment)) {
      domainsByEnvironment.set(environment, [])
    }
    domainsByEnvironment.get(environment).push(name)
  }

  return Array.from(domainsByEnvironment, ([environment, domains]) => ({
    environment_id: environment,
    deployment_id: environmentDeployments?.[environment]?.deploymentId ?? null,
    domains
  }))
}

const resolveLoadedBindings = (workload, isV6) => {
  if (Array.isArray(workload.bindings) && workload.bindings.length) {
    return workload.bindings
  }

  if (isV6 && workload.deployment_id != null) {
    return [
      {
        environment_id: workload.environment_id ?? null,
        deployment_id: workload.deployment_id,
        domains: workload.domains ?? []
      }
    ]
  }

  return []
}

const buildLoadedV6DomainEntries = (bindings = []) => {
  if (!Array.isArray(bindings)) return []

  return bindings.flatMap((binding) =>
    (Array.isArray(binding?.domains) ? binding.domains : []).map((entry) => ({
      name: typeof entry === 'string' ? entry : entry?.name,
      environment: binding?.environment_id ?? null,
      certificate: typeof entry === 'object' ? (entry?.certificate ?? null) : null
    }))
  )
}

export const WorkloadAdapter = {
  transformCreateWorkload(payload) {
    const isV6 = hasFlagUseV6Configurations()

    let domains
    let tls
    let bindings

    if (isV6) {
      const domainEntries = buildV6DomainEntries(payload)
      // domains = domainEntries.map((entry) => entry.name)
      bindings = buildV6Bindings(domainEntries, payload.environmentDeployments)

      tls = handleTls(payload)
    } else {
      domains = payload.domains
        .filter(({ subdomain, domain }) => subdomain || domain)
        .map(({ subdomain, domain }) => (subdomain ? `${subdomain}.${domain}` : domain))

      if (payload.useCustomDomain) {
        domains.unshift(`${payload.customDomain}.azion.app`)
      }

      tls = handleTlsLegacy(payload)
    }

    const payloadResquest = {
      name: payload.name,
      active: payload.active,
      infrastructure: payload.infrastructure,
      tls,
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
        enabled: payload.mtls.isEnabled,
        config: {
          verification: payload.mtls.isEnabled ? payload.mtls.verification : null,
          certificate: payload.mtls.certificate ?? null,
          crl: payload.mtls.crl || null
        }
      },
      domains,
      workload_domain_allow_access: payload.workloadHostnameAllowAccess
    }
    if (isV6) {
      payloadResquest.bindings = bindings
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
        lastModified: formatDateToDayMonthYearHour(workload.last_modified),
        lastEditor: workload.last_editor,
        productVersion: workload.product_version,
        protocols: workload.protocols,
        tls: workload.tls,
        mtls: workload.mtls,
        workloadDomainAllowAccess: workload.workload_domain_allow_access,
        infrastructure: workload.infrastructure === 1 ? 'Production' : 'Staging',
        active: workload.active
          ? { content: 'Active', severity: 'success' }
          : { content: 'Inactive', severity: 'danger' },
        workloadHostname: {
          content: workload.workload_domain
        },
        domains: workload.domains,
        bindings: workload.bindings ?? []
      }
    })
  },
  transformCachedWorkloadToEdit(item) {
    const isV6 = hasFlagUseV6Configurations()

    return {
      id: item.id,
      name: item.name?.text ?? item.name,
      active: item.active?.content === 'Active',
      workloadHostname: item.workloadHostname?.content?.replace(/\.azion\.app$/, ''),
      infrastructure: item.infrastructure === 'Production' ? '1' : '2',
      isLocked: item.isLocked,
      workloadHostnameAllowAccess: item.workloadDomainAllowAccess,
      initialDomains: item.domains,
      tls: item.tls
        ? {
            minimumVersion: item.tls.minimum_version,
            ciphers: item.tls.ciphers || SUPPORTED_CIPHERS_LIST_OPTIONS[0].value,
            ...(isV6 ? {} : { certificate: item.tls.certificate || 0 })
          }
        : undefined,
      protocols: item.protocols?.http
        ? {
            http: {
              useHttp3: item.protocols.http.quic_ports !== null,
              useHttps: item.protocols.http.https_ports !== null,
              httpPorts: item.protocols.http.http_ports?.map((port) =>
                HTTP_PORT_LIST_OPTIONS.find((option) => option.value === port)
              ) || [HTTP_PORT_LIST_OPTIONS[0]],
              httpsPorts: item.protocols.http.https_ports?.map((port) =>
                HTTPS_PORT_LIST_OPTIONS.find((option) => option.value === port)
              ) || [HTTPS_PORT_LIST_OPTIONS[0]],
              quicPorts: item.protocols.http.quic_ports?.map((port) =>
                HTTP3_PORT_LIST_OPTIONS.find((option) => option.value === port)
              ) || [HTTP3_PORT_LIST_OPTIONS[0]]
            }
          }
        : undefined,
      mtls: item.mtls
        ? {
            isEnabled: item.mtls.enabled,
            verification: item.mtls.config?.verification?.toLowerCase() || null,
            certificate: item.mtls.config?.certificate,
            crl: item.mtls.config?.crl
          }
        : undefined
    }
  },
  transformLoadWorkload({ data: workload }, workloadDeployment, zones = []) {
    const isV6 = hasFlagUseV6Configurations()

    const bindings = resolveLoadedBindings(workload, isV6)
    const v6FullDomains = buildLoadedV6DomainEntries(bindings)
    const environmentDeployments = bindings.reduce((acc, binding) => {
      if (binding?.environment_id != null) {
        acc[binding.environment_id] = { deploymentId: binding.deployment_id ?? null }
      }
      return acc
    }, {})

    const { azionAppSubdomains, cleanDomains } = isV6
      ? { azionAppSubdomains: '', cleanDomains: buildV6CleanDomains(v6FullDomains, zones) }
      : extractAzionAppSubdomainLegacy(workload.domains, zones)

    if (isV6) {
      const legacyCertificate = workload.tls?.certificate ?? null
      if (legacyCertificate !== null) {
        cleanDomains.forEach((domain) => {
          if (domain.certificate === null || domain.certificate === undefined) {
            domain.certificate = legacyCertificate
          }
        })
      }
    }

    return {
      id: workload.id,
      name: workload.name,
      active: workload.active,
      workloadHostname: workload.workload_domain?.replace(/\.azion\.app$/, ''),
      workloadDeploymentId: isV6 ? (bindings[0]?.deployment_id ?? null) : workloadDeployment?.id,
      application: workloadDeployment?.application,
      firewall: workloadDeployment?.firewall,
      customPage: workloadDeployment?.customPage,
      initialDomains: isV6 ? v6FullDomains : workload.domains,
      domains: cleanDomains,
      customDomain: azionAppSubdomains,
      useCustomDomain: !!azionAppSubdomains,
      infrastructure: String(workload.infrastructure),
      workloadHostnameAllowAccess: workload.workload_domain_allow_access,
      tls: {
        minimumVersion: workload.tls.minimum_version,
        ciphers: workload.tls.ciphers || SUPPORTED_CIPHERS_LIST_OPTIONS[0].value,
        ...(isV6 ? {} : { certificate: workload.tls.certificate || 0 })
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
        isEnabled: workload.mtls.enabled,
        verification: workload.mtls.config.verification?.toLowerCase() || null,
        certificate: workload.mtls.config.certificate,
        crl: workload.mtls.config.crl
      },
      isLocked: isLocked(workload.product_version),
      bindings,
      environmentDeployments
    }
  }
}
