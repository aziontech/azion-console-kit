
## INFORMAÇÔES SOBRE NOVOS GRÁFICOS
  
#### ATENÇÃO!!!!
Esse arquivo não deve ser mergeado.
  
Ele contém informações relevantes para a migração dos novos graficos do modulo do metrics. Deve ser removido ao final do trabalho juntamente com arquivos do playground e dados mockados.

A validação deste trabalho da UXE-4675 deve ser validade em uma edge application separada. Gráficos mockados não devem ir para stage/prod.

Talvez essa explicação sirva ao propósito, mas qualquer dúvida sobre como novos gráficos serão inseridos, Matheus criou um video tutorial há um tempo que certamente irá ajudar.

> Criei um grupo novo na tela do metrics para guardar todos os gráficos. Ela deve ser removida ao final da integração. O trabalho final que deve ir para stage é apenas o de formatação e de renderização dos dados, já que novas propriedades para apresentar os novos gráficos serão adicionados posteriormente.
 
----

#### Documentações que podem ajudar
- https://openlayers.org/en/latest/apidoc/
- https://c3js.org/

---

#### Entendendo o fluxo de apresentação de um gráfico:
  - Adiciona os dados estáticos no dashboard;
  - Ao carregar a tela o módulo do metrics cria a query graphql no arquivo "convert-report-meta-to-gql";
  - Então o arquivo "load-report-with-meta" faz a chamada para o graphql e retorna o resultado;
  - Nesse ponto o arquivo "convert-beholder-to-chart" prepara os dados para serem utilizados pelos gráficos;
  - É nesse ponto que devemor criar as variações de formatação para os novos tipos dentro do switch;
  - Após o tratamento, os valores são atualizados no modulo, que possui os estados do metrics (em real-time-metrics/index.js);
  - Agora a view chama esse modulo e renderiza os novos gráficos.
  - Para os gráficos da c3, a formatação deve ser feita no arquivo "format-c3-graph-props".
  - Para os gráficos de mapa, big number e tabela, novo(s) formatador(es) deve(m) ser criado(s).

---

  Os componentes base estão dentro da pasta playground e deve(m) ser removido(s) ao final do trabalho.
  Lá é possível visualizar o contrato esperado de cada novo gráfico para o seu correto funcionamento.

  Os componentes de graficos devem ficar na pasta graphs-card-block

--- 
#### Exemplos de query a serem utilizadas nos gráficos:

PIE, DONUT, ORDERED BARS

```graphql
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
```

GAUGE e BIG NUMBERS

```graphql
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
```

MAP

```graphql
query BandwidthAndBlockedRequestsLocation {
  httpMetrics(
    limit: 5
    filter: {
      tsRange: {begin:"yyyy-mm-ddThh:mm:ss", end:"yyyy-mm-ddThh:mm:ss"}
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
```