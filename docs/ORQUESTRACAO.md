# Orquestração, estilos e versões — 0.4.0

O agente Codex ou Claude conduz a direção e a revisão. O comando local organiza os arquivos, valida os contratos, monta as versões, renderiza e retoma etapas. Não há modelo nem assinatura de API embutidos; rodar apenas o script prepara a entrada e pode parar em `aguardando-direcao`. Com o agente ativo seguindo a skill, ele preenche a direção, executa a montagem e revisa as prévias.

## Novo vídeo de uma marca existente

Grave sua fala. Cada nova gravação deve ter sua própria pasta de produção. Você pode iniciar o agente de qualquer pasta se indicar os caminhos absolutos e pedir a skill `cinema-9d-edicao`.

```sh
# COMANDO — ajuste os caminhos da instalação, do trabalho e da gravação
~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/caminho/novo-video" \
  --video "/caminho/gravei.mp4" --kit minha-marca --nome "Minha marca — novo tema"
~/projetos/cinema-9d-edicao/bin/cinema-edicao produzir "/caminho/novo-video" --versoes 3 --cpu
```

`--kit` usa a biblioteca local, por padrão `~/projetos/cinema-9d-biblioteca`. Use `--biblioteca "/outro/local"` em `iniciar`, `estilos`, `estilo`, `kit`, `kit-registrar` e `estilo-registrar` para mudar o local. A biblioteca pode ficar em qualquer pasta, fora do código do método. Ela não acompanha automaticamente um clone do GitHub.

Se só o catálogo do método estiver instalado, use `--estilo exemplo`; forneça logo, fonte e telas em `marca/` e `interface/`, ou registre seu próprio kit. O catálogo de estilo contém regras e tokens; o kit contém os materiais selecionados da marca. Nunca coloque toda a produção antiga na biblioteca.

No agente, envie:

> Use a skill cinema-9d-edicao. A nova produção está em /caminho/novo-video. Edite a fala usando o kit minha-marca e crie 3 versões com diferenças editoriais relevantes, preservando a mensagem e os gestos. Leia o briefing e o perfil; execute produzir, preencha o plano do lote, gere e revise as prévias. Mostre a galeria para minha aprovação. Não use serviços pagos nem publique sem meu pedido.

O agente deve ouvir/ler a nova fala e observar a pessoa; o perfil anterior não contém os gestos, máscaras ou timestamps do novo take. Para falar do mesmo produto, bastam nova gravação e objetivo. Materiais novos serão necessários se a fala exigir telas que ainda não existem, campanhas específicas, novos ambientes ou tomadas. Cenas com IA, troca de roupa, recorte de corpo, rastreamento e 3D customizado são trabalhos adicionais explícitos; não são criados pelo comando de lote e não devem bloquear uma primeira montagem local possível.

## Etapas e arquivos

| Etapa | Responsável | Resultado |
|---|---|---|
| Análise, Whisper e proposta de cortes | Ferramentas locais | Transcrição, frames e tempos originais |
| Direção da fala e variantes | Agente ativo | `plano.json` com exatamente N versões |
| Validação e montagem | Orquestrador local | Produções isoladas em `versoes/<lote>/v001` etc. |
| Render e checagens técnicas | Remotion e FFmpeg | Prévia MP4, hash e metadados de cada versão |
| Revisão visual, fala e sincronismo | Agente ativo | `revisao-criativa.json` ligada aos MP4s atuais |
| Aprovação das prévias | Usuário | Registro explícito, separado da revisão do agente |
| Exportação | Orquestrador local | MP4s finais 1080×1920 e galeria |

A quantidade vai de 1 a 100. Renderização é sequencial para limitar memória. O número é um limite operacional, não uma promessa de 100 ideias criativas a partir de uma frase. O agente deve tornar cada estratégia útil; se o material não comportar o pedido, deve explicar isso. Versões podem variar abertura visual, hierarquia, duração com cortes coerentes, ritmo ou apresentação das telas. Trocar só o nome, ID ou nota não conta: planos idênticos são rejeitados. Diferenças cosméticas podem passar na validação estrutural; a utilidade editorial continua sendo responsabilidade da direção/revisão.

Com a mesma gravação, não invente novos ganchos falados nem frases de CTA. Para isso, peça takes alternativos ou autorização específica para outro recurso. Preserve o sentido da fala.

Cada execução tem um UUID, com estado em `orquestracao/lotes/<lote>/estado.json`, pedido em `pedido-do-agente.md`, modelo em `plano-modelo.json` e ponteiro em `orquestracao/ativo.json`. O agente escreve `plano.json` ao lado do modelo. `DirectionSchema` e `CreativeReviewSchema`, em `scripts/orchestration.ts`, são os contratos executáveis. Cortes/cenas usam `src/schema.ts`; são os mesmos formatos da edição simples. As versões podem referenciar somente arquivos internos da produção.

A galeria está em `saida/lotes/<lote>/index.html`. Ela abre os MP4s locais e não envia nada à internet. Compartilhe os arquivos necessários separadamente se quiser revisão em outra máquina.

## Retomar, mudar a direção e aprovar

```sh
# COMANDO — retomar o lote atual, sem repetir prévias concluídas
~/projetos/cinema-9d-edicao/bin/cinema-edicao produzir "/caminho/novo-video"
~/projetos/cinema-9d-edicao/bin/cinema-edicao lote-status "/caminho/novo-video"

# COMANDO — outra direção/quantidade; preserva o lote anterior
~/projetos/cinema-9d-edicao/bin/cinema-edicao produzir "/caminho/novo-video" --versoes 5 --novo

# COMANDO — somente depois do seu OK às prévias atuais e revisão criativa válida
~/projetos/cinema-9d-edicao/bin/cinema-edicao aprovar-lote "/caminho/novo-video" --por "Seu nome"
~/projetos/cinema-9d-edicao/bin/cinema-edicao finalizar-lote "/caminho/novo-video"
```

Antes da primeira montagem, o plano é editável. Após começar, fica congelado por hash. Não edite versões já montadas para contornar o contrato: preserve o lote e use `--novo`. Uma revisão r02 dentro de uma edição simples é histórico de ajustes; v001 e v002 neste fluxo são alternativas independentes. Uma produção com composição própria `edicao/remotion-*` continua protegida: use seus próprios scripts, não o lote central por cima dela.

Origem, materiais, briefing, perfil, método, plano e MP4s são verificados. Mudanças relevantes bloqueiam aprovação/retomada como se nada tivesse ocorrido. O lote precisa ser recalculado após atualização do método. Interrupções retomam versões registradas e prévias concluídas. Uma interrupção rara entre a conclusão do diretório e seu registro pode deixar uma pasta órfã: preserve-a e use um novo lote. Não apague travas enquanto um processo estiver ativo. Não há retomada automática de um render pela metade, publicação, fila remota ou sincronização entre máquinas.

A checagem técnica confirma estrutura, mídia, áudio, duração e dimensões; não confirma texto, gesto, leitura, semelhança de pessoa ou qualidade publicitária. O registro criativo deve apontar tempos e observações reais. O agente nunca registra aprovação em nome do usuário sem autorização. Os registros são arquivos locais, não autenticação de identidade humana.

## Aprendizados e custo

O estilo incorpora apenas regras conferidas; `aprendizados/` guarda propostas, não treina o modelo nem muda o perfil sozinho. Para promover uma regra, revise evidência, atualize uma nova versão do estilo e gere outro estudo. Preferências locais, nomes, takes, voz e arquivos privados permanecem na produção. Leia [como criar estilos](CRIAR-ESTILO.md).

Whisper, Remotion, FFmpeg e os arquivos do kit operam localmente. Higgsfield, imagem generativa, voz e outras APIs são opcionais e só entram após pedido/autorização de custo. Este fluxo não inicia subprocessos de outros agentes nem consome créditos de provedores automaticamente. A assinatura/sessão do agente ativo continua sendo a usada pelo operador.
