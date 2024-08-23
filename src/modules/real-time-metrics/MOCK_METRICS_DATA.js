/*
  ATENÇÃO!!!!
  Esse arquivo não deve ser mergeado.
  Ele contém dados mockados e informações relevantes para a migração dos novos graficos do modulo do metrics. Deve ser removido ao final do trabalho.

  Criei um grupo novo na tela do metrics para guardar todos os gráficos. Ela deve ser removida ao final da integração. O trabalho final que deve ir para stage é apenas o de formatação e de renderização dos dados, já que novas propriedades para apresentar os novos gráficos serão adicionados posteriormente.

  Qualquer dúvida sobre comos novos gráficos serão inseridos, Matheus criou um video tutorial há um tempo que certamente irá ajudar.

  -- DOCS:
  https://openlayers.org/en/latest/apidoc/
  https://c3js.org/
*/

export const MOCK_NEW_PAGE_INFO = {
  page: [
    {
      id: 0,
      label: 'New Charts',
      path: 'new-charts',
      groupId: 0,
      dashboards: [
        {
          id: '11111111111111111',
          label: 'New Charts',
          path: 'new-charts',
          dataset: 'httpMetrics'
        }
      ]
    }
  ],
  group: {
    label: 'New',
    value: 'new',
    id: 1,
    pagesDashboards: [
      {
        id: 0,
        label: 'New Charts',
        path: 'new-charts',
        groupId: 0,
        dashboards: [
          {
            id: '11111111111111111',
            label: 'New Charts',
            path: 'new-charts',
            dataset: 'httpMetrics'
          }
        ]
      }
    ]
  },
  dashboard: [
    {
      id: '444444444444444444',
      chartOwner: 'azion',
      label: 'Ordered Bar Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'ordered-bar',
      xAxis: 'cat',
      isTopX: true,
      rotated: true,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '333333333333333333',
      chartOwner: 'azion',
      label: 'Donut Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'donut',
      xAxis: 'cat',
      isTopX: true,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    },
    {
      id: '222222222222222222',
      chartOwner: 'azion',
      label: 'Pie Chart',
      description: 'description',
      aggregationType: 'sum',
      columns: 6,
      type: 'pie',
      xAxis: 'cat',
      isTopX: true,
      rotated: false,
      dataUnit: 'bytes',
      dataset: 'httpMetrics',
      limit: 5,
      fields: ['bandwidthTotal'],
      groupBy: ['geolocCountryName'],
      aggregations: [
        {
          aggregation: 'count',
          variable: 'rows'
        }
      ],
      orderDirection: 'DESC',
      dashboardId: '11111111111111111',
      helpCenterPath: 'path'
    }
  ]
}

/*
Exemplos de query a serem utilizadas nos gráficos:

-- PIE, DONUT, ORDERED BARS

query {
  httpMetrics(
    limit: 5
    filter: {
      tsRange: {begin:"yyyy-mm-ddThh:mm:ss", end:"yyyy-mm-ddThh:mm:ss"}
    }
    aggregate: {count: rows} 
    groupBy: [geolocCountryName]
    orderBy: [count_DESC]
  )
  {
    geolocCountryName
    bandwidthTotal
    count
  }
}

-- GAUGE e BIG NUMBERS

query {
  dataStreamedMetrics(
    limit: 1000
    filter: {
      tsRange: {begin:"yyyy-mm-ddThh:mm:ss", end:"yyyy-mm-ddThh:mm:ss"}
    }
    aggregate: {
      sum: dataStreamed
    }
    groupBy: [ts]
    orderBy: [ts_ASC]
  )
  {
    ts
    sum
  }
}

-- MAP
query BandwidthAndBlockedRequestsLocation {
  httpMetrics(
    limit: 5
    filter: {
      tsRange: {begin:"yyyy-mm-ddThh:mm:ss", end:"yyyy-mm-ddThh:mm:ss"}
      # blockeds
      wafLearningEq: "0"
      wafBlockEq: "1"
    }
    aggregate: {count: rows} 
    groupBy: [geolocCountryName, geolocRegionName]
    orderBy: [count_DESC]
  )
  {
    geolocCountryName
    geolocRegionName
    bandwidthTotal
    count
  }
}


*/
