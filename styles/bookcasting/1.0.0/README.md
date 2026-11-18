# BookCasting — editorial com conexões · 1.0.0

Perfil extraído da linguagem da produção R10, cuja aprovação foi registrada em 17/10/2026. A aprovação refere-se àquela produção. Esta consolidação e vídeos futuros precisam de avaliação visual própria.

## O que está consolidado

- Paleta: vermelho `#ca2d34`, branco, preto `#161616`, neutro quente `#746965`.
- Figtree, títulos com peso 650 e lettering com peso 750. A fonte é fornecida pela produção, não redistribuída neste pacote.
- Fundo branco com arcos e lavagens vermelhas sutis.
- Lettering com altura fixa, movimento lateral lento e opção de contorno de 3,5 px.
- Cards brancos com borda e sombra discreta, telas em perspectiva e ícones com volume por camadas.
- Conexões vermelhas progressivas e hub central estável.
- Logo controlado por cena: revelação central e fixação no topo central. A posição padrão no canto não é usada neste perfil.
- Legendas em frases, com sublinhado na palavra falada e supressão explícita por trecho. A faixa foi posicionada em área segura na consolidação; não é uma cópia das coordenadas antigas da R10.
- Linha de apoio ao recorte do apresentador, sem inserir um degradê que apague mãos/roupa.

## Aplicar em outra produção BookCasting

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao estilos
~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/caminho/Novo vídeo BookCasting" --nome "Novo vídeo" --tema "Meu tema" --estilo bookcasting --versao 1.0.0 --video "/caminho/gravacao.mp4"
```

Forneça logo, arquivo Figtree, telas reais, imagens autorizadas e briefing na nova pasta. `marca/identidade.json` aceita `logo` e `fontFile` relativos à produção. Sem o arquivo da fonte, o sistema pode usar outra fonte; o render em si não comprova equivalência tipográfica.

Em uma produção da base sem prévia, use `estilo "/pasta" --usar bookcasting --versao 1.0.0`. Se a revisão já tiver prévia, preserve-a com `revisao --nome r02` antes da troca. O comando recusa aplicar BookCasting sobre uma identidade com outro nome; outro cliente precisa de um perfil próprio.

O estilo é copiado em `marca/estilo.json` e fixado por ID, versão e SHA-256 no `job.json`. O render lê esse snapshot, não a última versão do catálogo. Atualizar o perfil central não altera trabalhos antigos. Não edite o SHA manualmente para aceitar modificações.

## Direção para o agente

> Use o perfil BookCasting 1.0.0 desta produção. Leia o briefing, a nova fala e os gestos. Escolha entre as receitas de apresentador/lettering, hub de conexões, tela real, elenco, revelação de marca e encerramento. Recalcule os tempos pela gravação. Preserve as decisões do perfil e ajuste as posições para o rosto, as mãos e a leitura. Mostre o plano e uma prévia. A referência R10 não autoriza copiar sua fala, fotos, clipes de IA ou tempos.

## Campos que implementam o estilo

- `scene.lettering`: `text`, `top`, `size`, `outline`, `drift`. Substitui o gráfico de título padrão e aparece atrás do retângulo do vídeo. Uma pessoa sobre o lettering exige máscara/transparência preparada; não há recorte automático.
- `scene.branding`: `hide`, `reveal` ou `show`. Com perfil controlado por cena, ausência do campo mantém o logo oculto.
- `scene.elements`: cards/telas/textos e `kind: icon`, com `icon: people | link | opportunity | search | profile`.
- `scene.connections`: conexões entre IDs existentes.
- `scene.presenter: hide`: retira a imagem e mantém a voz.
- `scene.captionMode` e `captionSuppression`: controlam redundância com os letterings.
- `scene.viewport`, `framing`, `zoom` e `zoomTo`: ajustam o enquadramento da nova gravação.

As receitas são guias de direção com parâmetros; não geram cenas nem fazem orquestração automaticamente. O perfil não inclui clone de imagem/voz, troca de roupa ou rastreamento. A orquestração 0.4.0 cria versões com direção do agente ativo; consulte ../../../docs/ORQUESTRACAO.md. O volume visual usa perspectiva e camadas; objetos 3D reais continuam sendo assets/componentes específicos.

## O que continua sendo definido por vídeo

Fala, roteiro, duração, público, CTA, momento da apresentação da marca, gestos, cortes, figurino, máscaras e imagens. O anúncio de referência tinha uma cena sem apresentador para resolver uma transição; isso é uma opção de composição, não um intervalo obrigatório de todo vídeo.

Não repetir tempos ou esticar boca/voz para preencher outro conteúdo. Observe o limite dos arquivos utilizados: uma inserção gerada em 1080 não tem a mesma margem de crop de uma gravação 4K.

## Estudo e validação

`demo-estilo "/tmp/pasta-nova" --estilo bookcasting` cria um estudo com fonte de teste, interface sintética e marca ilustrativa. Depois use `previa`. Não é uma publicidade aprovada nem uma reprodução pixel a pixel da R10.

Para repetir a validação técnica completa: `npm run validar:base`, opcionalmente `-- --font "/caminho/figtree.woff2"`. Ela utiliza somente fixtures temporárias e encerra o Studio que cria. O relatório separa resultados técnicos da avaliação visual humana. A revisão estética do perfil continua sendo feita na prévia.
