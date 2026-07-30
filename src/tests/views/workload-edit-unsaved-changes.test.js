import { defineComponent, h, inject } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { FormContextKey } from 'vee-validate'

import EditFormBlock from '@/templates/edit-form-block'
import FormFieldsWorkload from '@/views/Workload/FormFields/FormFieldsWorkload.vue'
import { validationSchema } from '@/views/Workload/Config/validation'
import { HTTP_PORT_LIST_OPTIONS, HTTPS_PORT_LIST_OPTIONS, HTTP3_PORT_LIST_OPTIONS } from '@/helpers'

const { drawerStubModule } = vi.hoisted(() => ({
  drawerStubModule: () => ({
    default: {
      name: 'DrawerStub',
      template: '<span />',
      methods: {
        changeCertificateType() {},
        openCreateDrawer() {}
      }
    }
  })
}))

vi.mock('@/views/DigitalCertificates/Drawer', drawerStubModule)
vi.mock('@/views/DigitalCertificates/Drawer/', drawerStubModule)
vi.mock('@/views/EdgeApplications/Drawer', drawerStubModule)
vi.mock('@/views/EdgeFirewall/Drawer', drawerStubModule)
vi.mock('@/views/CustomPages/Drawer', drawerStubModule)

vi.mock('@/services/v2/digital-certificates/digital-certificates-service', () => ({
  digitalCertificatesService: {
    listDigitalCertificatesDropdown: vi.fn().mockResolvedValue({
      count: 1,
      body: [
        {
          label: 'Certificates',
          items: [
            {
              id: 123,
              name: 'my-cert',
              status: 'active',
              authority: 'authority-x',
              subjectName: ['example.com'],
              icon: ''
            }
          ]
        }
      ]
    }),
    loadDigitalCertificate: vi.fn().mockResolvedValue({
      id: 123,
      name: 'my-cert',
      authority: 'authority-x',
      subjectName: ['example.com']
    })
  }
}))

vi.mock('@/services/v2/digital-certificates/digital-certificates-crl-service', () => ({
  digitalCertificatesCRLService: {
    listDigitalCertificatesCRLDropdown: vi.fn().mockResolvedValue({ count: 0, body: [] }),
    loadDigitalCertificateCRL: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@/services/v2/edge-dns/edge-dns-service', () => ({
  edgeDNSService: {
    listEdgeDNSService: vi.fn().mockResolvedValue({ body: [] })
  }
}))

vi.mock('@/services/v2/edge-app/edge-app-service', () => ({
  edgeAppService: {
    listEdgeApplicationsServiceDropdown: vi
      .fn()
      .mockResolvedValue({ count: 1, body: [{ id: 1695294281, name: 'my application' }] }),
    loadEdgeApplicationService: vi
      .fn()
      .mockResolvedValue({ id: 1695294281, name: 'my application' })
  }
}))

vi.mock('@/services/v2/edge-firewall/edge-firewall-service', () => ({
  edgeFirewallService: {
    listEdgeFirewallServiceDropdown: vi.fn().mockResolvedValue({ count: 0, body: [] }),
    loadEdgeFirewallService: vi.fn().mockResolvedValue(null)
  }
}))

vi.mock('@/services/v2/custom-page/custom-page-service', () => ({
  customPageService: {
    listCustomPagesService: vi.fn().mockResolvedValue({ count: 0, body: [] }),
    loadCustomPagesService: vi.fn().mockResolvedValue(null)
  }
}))

const loadedWorkload = () => ({
  id: 42,
  name: 'my workload',
  active: true,
  workloadHostname: 'abc123',
  workloadDeploymentId: 7,
  application: 1695294281,
  firewall: null,
  customPage: null,
  initialDomains: ['www.example.com'],
  domains: [{ subdomain: 'www', domain: 'example.com' }],
  customDomain: '',
  useCustomDomain: false,
  infrastructure: '1',
  workloadHostnameAllowAccess: true,
  tls: { minimumVersion: 'tls_1_2', ciphers: 'TLSv1.2_2021', certificate: 123 },
  protocols: {
    http: {
      useHttp3: false,
      useHttps: true,
      httpPorts: [HTTP_PORT_LIST_OPTIONS[0]],
      httpsPorts: [HTTPS_PORT_LIST_OPTIONS[0]],
      quicPorts: [HTTP3_PORT_LIST_OPTIONS[0]]
    }
  },
  mtls: { isEnabled: false, verification: null, certificate: null, crl: null },
  isLocked: false,
  authorityCertificate: 'authority-x',
  subjectNameCertificate: ['example.com']
})

const collectDiff = (current, initial, path = '', out = []) => {
  const keys = new Set([...Object.keys(current ?? {}), ...Object.keys(initial ?? {})])

  for (const key of keys) {
    const currentValue = current?.[key]
    const initialValue = initial?.[key]
    const childPath = path ? `${path}.${key}` : key

    if (
      currentValue !== null &&
      initialValue !== null &&
      typeof currentValue === 'object' &&
      typeof initialValue === 'object'
    ) {
      collectDiff(currentValue, initialValue, childPath, out)
    } else if (JSON.stringify(currentValue) !== JSON.stringify(initialValue)) {
      out.push({ path: childPath, currentValue, initialValue })
    }
  }

  return out
}

const settle = async () => {
  for (let round = 0; round < 30; round++) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

const mountWorkloadEdit = async ({ loadService, initialValues }) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/workloads/edit/:id', component: { template: '<div />' } }
    ]
  })
  router.push('/workloads/edit/42')
  await router.isReady()

  const probe = {}
  const FormProbe = defineComponent({
    setup() {
      probe.form = inject(FormContextKey)
      return () => null
    }
  })

  const wrapper = mount(EditFormBlock, {
    props: {
      schema: validationSchema,
      loadService,
      editService: vi.fn(),
      updatedRedirect: 'home',
      ...(initialValues ? { initialValues } : {})
    },
    slots: {
      form: () => [h(FormFieldsWorkload, { isEdit: true }), h(FormProbe)]
    },
    global: {
      plugins: [router, PrimeVue, ToastService],
      directives: { tooltip: Tooltip }
    }
  })

  await settle()

  return { wrapper, probe }
}

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms))

const cachedWorkload = () => ({
  id: 42,
  name: 'my workload',
  active: true,
  workloadHostname: 'abc123',
  infrastructure: '1',
  isLocked: false,
  workloadHostnameAllowAccess: true,
  initialDomains: ['www.example.com'],
  tls: { minimumVersion: 'tls_1_2', ciphers: 'TLSv1.2_2021', certificate: 123 },
  protocols: {
    http: {
      useHttp3: false,
      useHttps: true,
      httpPorts: [HTTP_PORT_LIST_OPTIONS[0]],
      httpsPorts: [HTTPS_PORT_LIST_OPTIONS[0]],
      quicPorts: [HTTP3_PORT_LIST_OPTIONS[0]]
    }
  },
  mtls: { isEnabled: false, verification: null, certificate: null, crl: null }
})

describe('Workload edit view — unsaved changes baseline', () => {
  it('keeps the form pristine after loading a workload without user interaction', async () => {
    const loadService = vi.fn().mockResolvedValue(loadedWorkload())

    const { probe } = await mountWorkloadEdit({ loadService })

    const { values, meta } = probe.form
    const diff = collectDiff(values, meta.value.initialValues)

    expect(diff).toEqual([])
    expect(meta.value.dirty).toBe(false)
  })

  it('keeps the form pristine when the user re-selects the already selected certificate', async () => {
    const loadService = vi.fn().mockResolvedValue(loadedWorkload())

    const { wrapper, probe } = await mountWorkloadEdit({ loadService })

    const certificateDropdown = wrapper
      .findAllComponents({ name: 'field-dropdown' })
      .find((dropdown) => dropdown.props('name') === 'tls.certificate')
    expect(certificateDropdown).toBeTruthy()

    certificateDropdown.vm.$emit('onSelectOption', {
      label: 'my-cert',
      value: 123,
      authority: 'authority-x',
      status: 'active',
      subjectName: ['example.com'],
      icon: '',
      group: 'Certificates'
    })
    await flushPromises()

    const { values, meta } = probe.form
    const diff = collectDiff(values, meta.value.initialValues)

    expect(diff).toEqual([])
    expect(meta.value.dirty).toBe(false)
  })

  it('keeps the form pristine when navigating from the list (cached values) with slow load', async () => {
    const loadService = vi.fn().mockImplementation(() => delay(40, loadedWorkload()))

    const { probe } = await mountWorkloadEdit({
      loadService,
      initialValues: cachedWorkload()
    })

    const { values, meta } = probe.form
    const diff = collectDiff(values, meta.value.initialValues)

    expect(diff).toEqual([])
    expect(meta.value.dirty).toBe(false)
  })

  it('keeps the form pristine when selected records are not in the first dropdown page', async () => {
    const { edgeAppService } = await import('@/services/v2/edge-app/edge-app-service')
    const { digitalCertificatesService } =
      await import('@/services/v2/digital-certificates/digital-certificates-service')

    edgeAppService.listEdgeApplicationsServiceDropdown.mockImplementation(() =>
      delay(5, { count: 1, body: [{ id: 111, name: 'another app' }] })
    )
    edgeAppService.loadEdgeApplicationService.mockImplementation(() =>
      delay(15, { id: 1695294281, name: 'my application' })
    )
    digitalCertificatesService.listDigitalCertificatesDropdown.mockImplementation(() =>
      delay(5, {
        count: 1,
        body: [
          {
            label: 'Certificates',
            items: [
              {
                id: 999,
                name: 'another-cert',
                status: 'active',
                authority: 'authority-y',
                subjectName: ['other.com'],
                icon: ''
              }
            ]
          }
        ]
      })
    )

    const loadService = vi.fn().mockImplementation(() => delay(40, loadedWorkload()))

    const { probe } = await mountWorkloadEdit({
      loadService,
      initialValues: cachedWorkload()
    })

    const { values, meta } = probe.form
    const diff = collectDiff(values, meta.value.initialValues)

    expect(diff).toEqual([])
    expect(meta.value.dirty).toBe(false)
  })
})
