const MOCK_BANNERS = [
  {
    id: 'g2-winter-2026',
    name: 'Azion Named a Leader in G2 Winter 2026 Reports.',
    tag: 'G2 WINTER 2026 REPORTS',
    ctaText: 'SEE BLOGPOST HERE',
    ctaHref: 'https://www.azion.com/en/blog/',
    images: [
      {
        src: 'https://www.azion.com/assets/pages/products/images/light/edge-application.png',
        alt: 'G2 High Performer Winter 2026'
      }
    ],
    priority: 10
  }
]

export const listBannersService = async () => {
  return MOCK_BANNERS
}
