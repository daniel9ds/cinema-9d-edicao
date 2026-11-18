# Sonoplastia (opcional)

Use este guia **somente** quando o briefing ou o usuário pedir um vídeo com sonoplastia (efeitos sonoros que acompanham cortes, cards, telas e movimentos). Sem esse pedido, siga a regra geral do método: som é opcional e vem de arquivos autorizados ou dos três sons do `setup`.

A voz é o centro do vídeo. Sonoplastia sublinha o que a fala e a imagem já mostram; não preenche cada cena nem compete com a fala.

## O que o método já faz

- O `setup` sintetiza três sons com FFmpeg (`click`, `whoosh`, `impact`). O `iniciar` os copia para `elementos/sons/` da produção.
- Cada cena aceita **um** som: `sound` (caminho relativo na produção) e `soundVolume` (0 a 0,25; padrão 0,1).
- O som começa no **início da cena** e é cortado no fim dela. Para acertar um momento exato, ajuste o `start` da cena ou crie uma cena curta para o gesto. Vários sons sobrepostos na mesma cena, ou um som que atravessa cenas, exigem montagem própria (`edicao/remotion-*`).
- Música entra pelo `job.json` (`music`, `musicVolume` até 0,15), em loop e sem ducking automático.
- Todo arquivo usado entra no hash da prévia. Trocar um som invalida a aprovação, como qualquer outro asset.

## Fontes de som

Em ordem de preferência:

1. **Arquivos fornecidos ou autorizados pelo usuário** em `elementos/sons/`.
2. **Sons gerados localmente**: os três do `setup` ou o banco do Earshot (abaixo). Não dependem de licença de terceiros.
3. **Openverse**: biblioteca aberta de áudios com licença Creative Commons, com busca por API.

Não use sons baixados de sites sem licença clara, nem extraídos de vídeos, filmes ou músicas de terceiros.

### Openverse

- Busca pública pela API, por exemplo `https://api.openverse.org/v1/audio/?q=whoosh&license=cc0`. Cada resultado traz título, autor, fonte, URL do arquivo e licença. Confira os parâmetros e limites atuais em [docs.openverse.org](https://docs.openverse.org).
- **Licença:**
  - **CC0 / domínio público:** preferido.
  - **CC BY / CC BY-SA:** só com crédito (título, autor, licença e link) no relatório de entrega e onde o cliente publicar o vídeo. Combine isso com o usuário antes.
  - **NC (não comercial):** não use em trabalho de cliente ou com fins comerciais.
  - **ND (sem derivações):** evite. Cortar, mixar ou alterar o volume pode ser derivação.
- A licença informada pela fonte pode estar errada. Abra a página de origem e confira antes de usar em trabalho comercial.
- **Baixar é download de terceiros:** liste os arquivos (título, autor, licença e tamanho) e baixe só depois do OK do usuário.

### Earshot

[Earshot](https://github.com/Leonxlnx/earshot) é um projeto de código aberto (MIT) que roda no computador, em CPU. Ele gera efeitos em código a partir de um banco de cerca de 250 sons e mede onde cada som tem o ataque e o pico. O banco renderiza sem modelos e sem rede.

- **Instalação externa ao método.** Precisa de `uv` e FFmpeg. O guia do projeto instala com `uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"`. As funções de escuta (`describe`, `match`, `critique`) baixam dois modelos abertos de cerca de 1,1 GB. Instale só com o OK do usuário e prefira uma versão marcada (por exemplo `@v0.4.1`) a `main`.
- **Comandos úteis para este método:**
  - `earshot sfx list --kind whoosh` lista os sons do banco.
  - `earshot sfx render <id> -o elementos/sons/<nome>.wav --dur <s> --apex <s>` gera um som com duração e pico definidos para casar com o movimento.
  - `earshot sfx check <arquivo>` aponta cliques, cauda cortada e clipping.
  - `earshot measure <arquivo>` mede loudness e pico sem modelos.
- **Não use** `earshot llm`: ele envia o áudio para um serviço externo. `forge` e `fit` criam sons novos a partir de referências; uma derivação de gravação de terceiros mantém a licença dela.
- Os sons do banco que derivam de gravações CC0 têm créditos no `docs/CREDITS_FIT.md` do projeto. Confira a licença antes de cada uso.
- É uma ferramenta recente e não foi validada pelo método. Teste numa produção sintética (`demo`) antes do primeiro trabalho real.

## Como conduzir

1. **Confirmar o pedido.** Qual é o nível de sonoplastia (discreta, média, marcada) e se há referência de estilo. Sem pedido de sonoplastia, não adicione efeitos além do que o estilo já prevê.
2. **Mapa de sons no plano.** Em `trabalho/plano-cenas.md`, liste para cada cena o gesto ou evento (corte, entrada de card, tela, troca de tema), o tipo de som e o volume. Uma cena sem som é uma escolha válida.
3. **Escolha e registro.** Para cada arquivo em `elementos/sons/`, registre em `elementos/sons/CREDITOS.md`: arquivo, origem (fornecido, `setup`, Earshot com id e parâmetros, ou Openverse com URL), autor, licença e SHA-256 (`shasum -a 256`).
4. **Volumes.** Comece em 0,06–0,12. Efeitos sob a fala ficam mais baixos que efeitos em pausas. Normalize arquivos muito altos antes de usar.
5. **Prévia e escuta.** Gere a prévia e ouça com fone e no alto-falante do celular. Confira: a fala inteligível, sons no tempo do gesto, nada repetitivo, sem cliques ou cortes secos, fim da cena sem cortar a cauda do som.
6. **Aprovação.** Mostre a prévia com a lista de sons. Aprovação continua sendo do usuário, pelo fluxo normal (`aprovar`/`final`).
7. **Entrega.** No relatório de entrega, cite `elementos/sons/CREDITOS.md` e os créditos obrigatórios das licenças CC BY.

## Limites

- Um som por cena, começando no início da cena. Sem ducking, mixagem multipista ou automação de volume no renderizador central.
- Nenhum comando do método busca no Openverse, instala o Earshot ou baixa sons. Quem faz é o agente, com autorização.
- A verificação técnica do render não avalia a sonoplastia. A escuta é do agente e do usuário.
