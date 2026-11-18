# Exemplo — editorial com conexões · 1.0.0

Perfil de exemplo do Cinema 9D Edição. Serve para conhecer os recursos de estilo e como ponto de partida de um perfil próprio. Foi estudado apenas com mídia sintética e não aprova nenhuma produção.

## O que define

- Identidade provisória "Sua marca": fundo `#101419`, acento `#a4ff63`, texto `#f5f6f1`, neutro `#aab1ba`, fonte Arial. São as mesmas cores da identidade padrão de uma produção nova.
- Títulos com peso 650 e lettering com peso 750.
- Fundo com arcos e lavagens suaves na cor de acento.
- Lettering com altura fixa, movimento lateral lento e contorno opcional.
- Cards escuros com borda e sombra discreta, telas em perspectiva e ícones com volume por camadas.
- Conexões progressivas entre cards e um card central estável.
- Logo controlado por cena: revelação central e fixação no topo central.
- Legendas em frases, com sublinhado na palavra falada e supressão explícita por trecho, dentro da área segura.
- Linha de apoio ao recorte do apresentador.

## Usar

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/caminho/novo-video" --nome "Novo vídeo" --estilo exemplo --versao 1.0.0 --video "/caminho/gravacao.mp4"
```

Numa produção da base sem prévia, use `estilo "/pasta" --usar exemplo --versao 1.0.0`. Se a revisão já tiver prévia, preserve-a antes com `revisao --nome r02`.

O estilo é copiado em `marca/estilo.json` e fixado por ID, versão e SHA-256 no `job.json`. O render lê esse snapshot, não a última versão do catálogo. Não edite o SHA manualmente para aceitar modificações.

Para usar as cores, a fonte e o logo da sua marca, crie um perfil próprio a partir deste:

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao estilo-criar "/biblioteca/rascunhos/minha-marca" --id minha-marca --nome "Minha marca" --marca "Minha marca" --base exemplo
```

Veja [criar estilo](../../../docs/CRIAR-ESTILO.md).

## Direção para o agente

> Use o perfil exemplo 1.0.0 desta produção. Leia o briefing, a nova fala e os gestos. Escolha entre as receitas de apresentador com lettering, hub de conexões, tela do produto, elenco de cards, revelação de marca e encerramento. Calcule os tempos pela gravação, ajuste as posições ao rosto, às mãos e à leitura, e mostre o plano e uma prévia.

## Campos que implementam o estilo

- `scene.lettering`: `text`, `top`, `size`, `outline`, `drift`. Substitui o título padrão e aparece atrás do retângulo do vídeo. Uma pessoa sobre o lettering exige máscara ou transparência preparada; não há recorte automático.
- `scene.branding`: `hide`, `reveal` ou `show`. Com logo controlado por cena, a ausência do campo mantém o logo oculto.
- `scene.elements`: cards, telas, textos e `kind: icon`, com `icon: people | link | opportunity | search | profile`.
- `scene.connections`: conexões entre IDs existentes.
- `scene.presenter: hide`: retira a imagem e mantém a voz.
- `scene.captionMode` e `captionSuppression`: evitam legenda redundante com o lettering.
- `scene.viewport`, `framing`, `zoom` e `zoomTo`: ajustam o enquadramento da gravação.

As receitas são guias de direção com parâmetros; não geram cenas sozinhas. O perfil não inclui clone de imagem ou voz, troca de roupa nem rastreamento. O volume visual usa perspectiva e camadas, não objetos 3D.

## Estudo

`demo-estilo "/tmp/pasta-nova" --estilo exemplo` cria um estudo com vídeo, interface e marca sintéticos. Depois rode `previa`. Os quadros e o MP4 ficam em `saida/previas/` da pasta de estudo.
