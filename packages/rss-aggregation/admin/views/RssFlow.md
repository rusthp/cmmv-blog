# Instalação de Dependências para Visualização de Fluxo RSS

Este documento contém instruções para adicionar dependências necessárias para habilitar a visualização de fluxo na interface de administração de RSS.

## Dependências Necessárias

Para habilitar completamente a visualização de fluxo, você precisará instalar as seguintes dependências:

```bash
# Instalar Vue Flow (para Vue 3)
pnpm --filter @cmmv/rss-aggregation add @vue-flow/core @vue-flow/background @vue-flow/controls @vue-flow/minimap @dagrejs/dagre
```

## Ativação

Após instalar as dependências, você precisará descomentar as linhas relevantes no arquivo `FlowView.vue`. Procure por comentários marcados com "// Estes imports seriam necessários..." e remova os comentários.

## Uso da Visualização de Fluxo

A visualização de fluxo permite ver graficamente a relação entre:

1. **Canais RSS** - A fonte dos feeds RSS
2. **Parsers** - Regras para extrair conteúdo
3. **Raw Content** - Conteúdo extraído bruto
4. **Processamento de IA** - Refinamento do conteúdo
5. **Posts** - Conteúdo pronto para publicação

Você pode interagir com o fluxo clicando nos nós para editar, adicionar ou remover elementos, e visualizar as relações entre eles.

## Solução de Problemas

Se você encontrar problemas com a visualização:

1. Verifique se todas as dependências foram instaladas
2. Abra o console do navegador para ver mensagens de erro
3. Verifique se você removeu todos os comentários necessários no código

Para mais informações, consulte a documentação oficial do [Vue Flow](https://vueflow.dev/). 