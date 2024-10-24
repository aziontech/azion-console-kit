import * as DigitalCertificatesService from '@/services/digital-certificates-services'
import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const digitalCertificatesRoutes = {
  path: '/digital-certificates',
  name: 'digital-certificates',
  children: [
    {
      path: '',
      name: 'list-digital-certificates',
      component: () => import('@views/DigitalCertificates/ListView.vue'),
      props: {
        listDigitalCertificatesService: DigitalCertificatesService.listDigitalCertificatesService,
        deleteDigitalCertificatesService:
          DigitalCertificatesService.deleteDigitalCertificatesService,
        documentationService: Helpers.documentationCatalog.digitalCertificates
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-digital-certificates',
      component: () => import('@views/DigitalCertificates/CreateView.vue'),
      props: {
        createDigitalCertificatesCSRService:
          DigitalCertificatesService.createDigitalCertificatesCSRService,
        createDigitalCertificatesService:
          DigitalCertificatesService.createDigitalCertificatesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          },
          {
            label: 'Create Digital Certificate',
            to: '/digital-certificates/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-digital-certificates',
      component: () => import('@views/DigitalCertificates/EditView.vue'),
      props: {
        editDigitalCertificateService: DigitalCertificatesService.editDigitalCertificateService,
        loadDigitalCertificateService: DigitalCertificatesService.loadDigitalCertificateService,
        updatedRedirect: 'list-digital-certificates',
        clipboardWrite: Helpers.clipboardWrite,
        documentationService: Helpers.documentationGuideProducts.generateLetsEncryptCertificate
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          },
          {
            label: 'Edit Digital Certificate'
          }
        ]
      }
    }
  ]
}
