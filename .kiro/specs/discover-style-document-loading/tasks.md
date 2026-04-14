# Plano de Implementação

- [x] 1. Adicionar seletor de page size na toolbar
  - Em `src/views/RealTimeEvents/Blocks/tab-panel-block.vue`, adicionar um `Dropdown` (PrimeVue) na toolbar com as opções: 50, 100, 1000, 2000
  - Criar `const PAGE_SIZE_OPTIONS = [50, 100, 1000, 2000]`
  - Criar `const selectedPageSize = ref(loadPersistedPageSize())` — valor padrão 100
  - Persistir a escolha no `localStorage` com chave `rte-page-size`
  - Substituir a constante `PAGE_SIZE = 50` pelo `selectedPageSize.value` em todas as referências
  - Quando o usuário muda o page size, recarregar os dados (`reloadListTable()`)
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 2. Adicionar estado `currentWindowEnd` e remover `currentOffset`
  - Adicionar `const currentWindowEnd = ref(null)` para rastrear o fim da última janela temporal carregada
  - Remover `const currentOffset = ref(0)` (não será mais usado com paginação temporal)
  - _Requirements: 2.1, 2.5_

- [x] 3. Parametrizar `getListFilter()` para aceitar `windowEnd`
  - Modificar a assinatura para `getListFilter(windowEnd = null)`
  - Quando `windowEnd` é fornecido e o range total > `MAX_LIST_RANGE_MS`, retornar `{ tsRangeBegin: max(windowEnd - MAX_LIST_RANGE_MS, originalBegin), tsRangeEnd: windowEnd }`
  - Para ranges ≤ `MAX_LIST_RANGE_MS`, retornar o filtro original sem alteração (preservation)
  - _Bug_Condition: isBugCondition(input) onde rangeMs > MAX_LIST_RANGE_MS_
  - _Preservation: Ranges ≤ 2h retornam filtro original inalterado_
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3_

- [x] 4. Reescrever `loadData()` com loop de preenchimento temporal
  - Setar `currentWindowEnd = tsRangeEnd` no início
  - Implementar loop "fill until target": buscar blocos de 2h regressivamente até acumular ≥ `PAGE_SIZE` (2000) documentos ou esgotar o range (`currentWindowEnd <= originalBegin`)
  - Cada iteração: chamar `getListFilter(currentWindowEnd)`, executar query via `listService`, concatenar resultados, mover `currentWindowEnd` para trás (`currentWindowEnd = blockBegin`)
  - Chamar `getTotalRecords` com o filtro do range COMPLETO (não o filtro restrito de `getListFilter`)
  - Calcular `hasMoreData = currentWindowEnd > originalBegin`
  - Manter o carregamento do gráfico independente (sem alteração)
  - _Bug_Condition: isBugCondition(input) onde rangeMs > MAX_LIST_RANGE_MS_
  - _Expected_Behavior: Documentos carregados via blocos temporais de 2h sem exceder limites do ClickHouse_
  - _Preservation: Gráfico, filtros, e interações de UI inalterados_
  - _Requirements: 2.1, 2.2, 2.3, 2.8, 3.1_

- [x] 5. Reescrever `loadMoreData()` com paginação temporal regressiva
  - Implementar mesmo loop "fill until target" a partir de `currentWindowEnd`
  - Buscar blocos de 2h regressivamente até acumular mais `PAGE_SIZE` documentos ou esgotar o range
  - Concatenar novos resultados aos existentes em `tableData`
  - Atualizar `hasMoreData = currentWindowEnd > originalBegin`
  - _Bug_Condition: loadMoreData usa offset → reescrever para paginação temporal_
  - _Expected_Behavior: Cada "Carregar mais" busca o próximo bloco temporal anterior_
  - _Preservation: Documentos existentes preservados, posição de scroll mantida_
  - _Requirements: 2.5, 2.8, 2.9_

- [x] 6. Atualizar `hasMoreData` e texto do botão "Carregar mais"
  - Computar `hasMoreData` baseado em `currentWindowEnd > originalRangeBegin`
  - Atualizar o texto do botão para "Exibindo X de N documentos"
  - Ocultar o botão quando `currentWindowEnd <= originalRangeBegin` (todos os blocos carregados)
  - _Requirements: 2.7, 2.9_

- [x] 7. Checkpoint — Validação manual
  - Testar com range "Last 5 minutes" (≤ 2h) — deve funcionar como antes
  - Testar com range "Today" (24h) — deve carregar documentos sem erro "system limit"
  - Testar "Carregar mais" — deve buscar blocos temporais anteriores
  - Testar que gráfico, filtros, brush-select, exportação e navegação por teclado continuam funcionando
  - Verificar que o texto "Exibindo X de N documentos" atualiza corretamente
