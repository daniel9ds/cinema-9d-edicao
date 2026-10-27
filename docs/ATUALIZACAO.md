# Atualizar sem misturar produções

## Instalação clonada do GitHub

1. Feche os Studios/renderizações que usam a base central e preserve alterações locais.
2. Na pasta do método, confira `git status`. Se houver mudanças, salve-as antes; não use reset para descartá-las.
3. Com a árvore limpa, rode `git pull --ff-only` e `npm ci`.
4. Leia `docs/aprendizados-incorporados.md`. Execute `npm run setup` se dependências de máquina estiverem ausentes e `npm run doctor` para inspecioná-las.
5. Reabra o agente para carregar as instruções da skill atualizada.

Os vínculos globais continuam apontando para a mesma instalação. Não é necessário copiar a skill para cada produção.

## Produções existentes

A versão 0.2.0 mantém a leitura dos campos antigos, mas acrescenta campos opcionais e controles. O método não migra ou altera produções automaticamente. Como os fingerprints incluem o código do método, uma edição da base precisa de nova prévia/revisão após a atualização para poder ser aprovada novamente.

Montagens próprias (`edicao/remotion-*` ou `job.rendering`) usam seus próprios scripts/documentos. A configuração na raiz pode ser histórica. Os comandos centrais recusam executar essa montagem antiga; não troque o renderizador só para contornar a proteção.

O comando `revisao` preserva decisões e transcrição, não toda a mídia/código. Faça backup completo para recuperação independente e preserve arquivos utilizados por revisões anteriores.

## Incorporar aprendizados

Na produção, registre observação, proposta e evidência em `aprendizados/`. Na instalação central, peça ao agente para analisar e incorporar melhorias reutilizáveis. Revise e retire dados privados antes de publicar. Não copie mídias de clientes, caches, configurações locais ou credenciais para o Git.

A consolidação precisa de uma alteração concreta em código, componentes ou instruções; não há treinamento ou atualização automática de modelo.
