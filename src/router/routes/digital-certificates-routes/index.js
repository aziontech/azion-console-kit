import * as Helpers from '@/helpers'

const certificateTypeMapping = {
  certificateRevogationList: {
    create: 'Create Certificate Revogation List',
    edit: 'Edit Certificate Revogation List'
  },
  trusted_ca_certificate: {
    create: 'Importing Trusted Certificate',
    edit: 'Edit Trusted Certificate'
  },
  edge_certificate: {
    create: 'Create Server Certificate',
    edit: 'Edit Server Certificate'
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
            label: 'Create Digital Certificate',
            to: '/digital-certificates/create',
            dynamic: true,
            baseLabel: 'Create Digital Certificate',
            queryParam: 'certificate',
            typeMapping: certificateTypeMapping
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
            label: 'Edit Digital Certificate',
            dynamic: true,
            baseLabel: 'Edit Digital Certificate',
            queryParam: 'certificate',
            typeMapping: certificateTypeMapping
          }
        ]
      }
    }
  ]
}
