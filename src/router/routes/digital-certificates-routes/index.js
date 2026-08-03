import * as Helpers from '@/helpers'
import { hasFlagUseV6Configurations } from '@/composables/user-flag'

export const certificatesTabGuard = (to) => {
  if (to.params.tab && !hasFlagUseV6Configurations()) {
    return '/not-found'
  }

  return true
}

const certificateTypeMapping = {
  certificateRevogationList: {
    label: 'Certificate Revocation List',
    create: 'Import',
    edit: 'Edit'
  },
  trusted_ca_certificate: {
    label: 'Trusted Certificate',
    create: 'Import',
    edit: 'Edit'
  },
  edge_certificate: {
    label: 'Server Certificate',
    create: 'Create',
    edit: 'Edit'
  }
}

/** @type {import('vue-router').RouteRecordRaw} */
export const digitalCertificatesRoutes = {
  path: '/digital-certificates',
  name: 'digital-certificates',
  children: [
    {
      path: '',
      name: 'list-digital-certificates',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/DigitalCertificates/v6/ListView.vue')
          : import('@views/DigitalCertificates/ListView.vue'),
      meta: {
        title: 'Certificate Manager',
        breadCrumbs: [
          {
            label: 'Certificate Manager',
            to: '/digital-certificates'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-digital-certificates',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/DigitalCertificates/v6/CreateView.vue')
          : import('@views/DigitalCertificates/CreateView.vue'),
      meta: {
        title: 'Create Digital Certificate',
        breadCrumbs: [
          {
            label: 'Certificate Manager',
            to: '/digital-certificates'
          },
          {
            to: '/digital-certificates',
            baseLabel: 'label',
            label: 'Server Certificate',
            typeMapping: certificateTypeMapping,
            queryParam: 'certificate',
            dynamic: true
          },
          {
            to: '/digital-certificates/create',
            baseLabel: 'create',
            label: 'Create',
            typeMapping: certificateTypeMapping,
            queryParam: 'certificate',
            dynamic: true
          }
        ]
      }
    },
    {
      path: 'edit/:id/:tab?',
      name: 'edit-digital-certificates',
      component: () =>
        hasFlagUseV6Configurations()
          ? import('@views/DigitalCertificates/v6/EditView.vue')
          : import('@views/DigitalCertificates/EditView.vue'),
      beforeEnter: certificatesTabGuard,
      props: {
        documentationService: Helpers.documentationGuideProducts.generateLetsEncryptCertificate,
        resourceKind: 'certificate'
      },
      meta: {
        title: 'Edit Digital Certificate',
        breadCrumbs: [
          {
            label: 'Certificate Manager',
            to: '/digital-certificates'
          },
          {
            to: '/digital-certificates',
            baseLabel: 'label',
            typeMapping: certificateTypeMapping,
            queryParam: 'certificate',
            label: 'Server Certificate',
            dynamic: true
          },
          {
            to: '/digital-certificates/edit',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    },
    {
      path: 'edit-crl/:id/:tab?',
      name: 'edit-crl-digital-certificates',
      component: () => import('@views/DigitalCertificates/v6/EditView.vue'),
      props: { resourceKind: 'crl' },
      meta: {
        title: 'Edit CRL',
        flag: 'use_v6_configurations',
        breadCrumbs: [
          {
            label: 'Certificate Manager',
            to: '/digital-certificates'
          },
          {
            to: '/digital-certificates/edit-crl',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
