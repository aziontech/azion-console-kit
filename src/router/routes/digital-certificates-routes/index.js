import * as Helpers from '@/helpers'

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
  },
}

/** @type {import('vue-router').RouteRecordRaw} */
export const digitalCertificatesRoutes = {
  path: '/digital-certificates',
  name: 'digital-certificates',
  children: [
    {
      path: '',
      name: 'list-digital-certificates',
      component: () => import('@views/DigitalCertificates/ListView.vue'),
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
      component: () => import('@views/DigitalCertificates/CreateView.vue'),
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
            label: 'Digital Certificate',
            typeMapping: certificateTypeMapping,
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
      path: 'edit/:id',
      name: 'edit-digital-certificates',
      component: () => import('@views/DigitalCertificates/EditView.vue'),
      props: {
        clipboardWrite: Helpers.clipboardWrite,
        documentationService: Helpers.documentationGuideProducts.generateLetsEncryptCertificate
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
            label: 'Digital Certificate',
            dynamic: true
          },
          {
            to: '/digital-certificates/edit',
            dynamic: true,
            routeParam: 'id'
          }
        ]
      }
    }
  ]
}
