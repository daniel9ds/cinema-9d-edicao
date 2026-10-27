# Método e arquivos de edição

## Operação

1. **Entrada:** criar o trabalho com `iniciar`, copiar o take e reunir marca, briefing e referências.
2. **Preparação:** `preparar` extrai seis quadros, transcreve localmente e propõe cortes por silêncio. Reutiliza uma transcrição se o SHA-256 do take não mudou. Não sobrescreve cortes/cenas existentes.
3. **Decupagem:** o agente lê a fala, confere os frames e ouve os limites necessários. Decide quais erros/repetições saem e preserva intenção, respiração e continuidade.
4. **Direção:** cria cenas que expliquem as ideias, em vez de apenas repetir a transcrição. Escolhe assets, hierarquia, movimento, formato do rosto e sons. Mostra o plano.
5. **Prévia:** `validar`, `planejar` para atualizar a tabela e `previa`. A prévia inclui três stills e um MP4 540×960. `previa --quadros` gera só PNGs. `studio` permite inspecionar a composição no navegador e sincroniza dados a cada 1,5s com trava curta. Confira `trabalho/studio-estado.json`: erros conservam a última versão válida. A trava `.cinema-studio.lock` impede dois Studios desta produção; não bloqueia a edição.
6. **Revisão:** ajustar conforme o feedback; marcar o plano como revisado e receber o OK da pessoa.
7. **Entrega:** `aprovar --por "Nome"`, `final`; MP4 1080×1920 com relatório técnico. Conferir áudio, leitura e enquadramento no celular antes de publicar.

Cada operação de edição usa uma trava `.cinema-edicao.lock` para impedir dois agentes de editar ao mesmo tempo. Depois de uma interrupção, verifique o PID registrado e remova a trava somente se a operação tiver parado.

## Contrato do trabalho

Todos os tempos estão em **segundos**, incluindo casas decimais. Os arquivos são JSON UTF-8. Caminhos de mídia são relativos ao trabalho e não podem usar `..`, URLs ou links para fora da pasta. Para mídia de outra pasta, copie primeiro. Caminhos com espaços e acentos são aceitos.

### `job.json`

```json
{
  "version": 1,
  "name": "Vídeo da minha marca",
  "video": "entrada/take.mov",
  "language": "pt",
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "framing": {"x": 50, "y": 45},
  "silence": {"thresholdDb": -35, "minimumSeconds": 0.7, "paddingSeconds": 0.18}
}
```

O foco é um `object-position` percentual, sem reconhecimento facial. Ajuste após olhar o card. Voz baixa pode exigir `thresholdDb` mais negativo. O script propõe a remoção de silêncio; não identifica por conta própria frases ruins.

### `marca/identidade.json`

```json
{
  "name": "Minha marca",
  "primary": "#a4ff63",
  "background": "#101419",
  "foreground": "#f5f6f1",
  "muted": "#aab1ba",
  "fontFamily": "Arial",
  "logo": "marca/logo.png"
}
```

`logo` é opcional. Para uma fonte fornecida pelo cliente, adicione `fontFile: "marca/fonte.woff2"` e ajuste `fontFamily`. A fonte precisa permitir uso no vídeo.

### `edicao/cortes.json` — tempo ORIGINAL

```json
{"version":1,"sourceDuration":12,"segments":[{"start":0.4,"end":4.8},{"start":6.2,"end":11.5}],"note":"Pausa longa retirada"}
```

Os segmentos são os trechos que permanecem, em ordem e sem sobreposição. A duração editada é a soma dos trechos. Cenas e legendas são quantizadas cumulativamente no render, evitando deriva entre muitos cortes. Exporte e confira as fronteiras com áudio; não há transição de áudio automática entre takes.

`trabalho/cortes-origem.json` liga a proposta ao SHA-256 do take. Se substituir o take, transcreva e refaça a decupagem; o validador rejeita o conjunto antigo. Não altere hashes para contornar essa checagem.

### Transcrições

`trabalho/whisper.json` e `.log` são a saída original do reconhecimento. `transcricao-original.json` guarda `words` com `text`, `start`, `end` e confiança opcional. Corrija o texto ao ouvir; não fabrique certeza quando o áudio for ambíguo.

`transcricao-editada.json` é derivada dos cortes e será regenerada. Corrija a transcrição ORIGINAL e execute `planejar`. Uma palavra permanece quando o ponto médio cai num segmento mantido; sua janela é limitada ao segmento. Revise cortes no meio de palavras.

### `edicao/cenas.json` — tempo EDITADO

```json
{
  "version": 1,
  "status": "draft",
  "scenes": [
    {"id":"gancho","start":0,"end":2.5,"type":"headline","title":"Sua ideia, em movimento","layout":"card","emphasis":["ideia"],"zoom":1.04},
    {"id":"etapas","start":2.5,"end":5,"type":"bullets","title":"Como funciona","items":["Grave","Revise","Publique"],"layout":"card","sound":"elementos/sons/click.wav","soundVolume":0.1}
  ]
}
```

As cenas devem cobrir a duração editada, sem sobreposição ou intervalos. Cada cena tem ID único. `status` muda de `draft` para `reviewed` quando o agente terminar a revisão da direção.

| Tipo | Campos adicionais | Uso |
|---|---|---|
| `headline` | `subtitle` opcional | Gancho ou ideia principal |
| `bullets` | `items` com até 4 textos | Etapas ou lista |
| `metric` | `value` textual | Número ou unidade com fonte |
| `comparison` | `items` com 2 textos | Comparar conceitos |
| `quote` | `subtitle` opcional | Frase de destaque |
| `image` | `image` com caminho relativo | Foto, print ou ilustração fornecida |
| `bars` | `bars: [{"label":"A","value":65}]` | Percentuais de 0 a 100 com fonte |

Campos comuns: `layout` (`card`/`full`), `emphasis` (palavras destacadas), `zoom` (1 a 1.2), `illustration` (sinaliza simulação), `sound` e `soundVolume` (0 a 0.25). `subtitle`, títulos e imagens precisam caber na área de gráfico. Listas curtas e títulos sucintos são mais legíveis. Use a prévia para checar quebra de linha.

As áreas base são: gráficos y=245–780, rosto/card y=825–1310, legendas y≈1360, margem esquerda 90 e direita 150. Elas são uma referência para Reels, ajustável às interfaces e aos canais. Títulos entram completos no primeiro quadro; demais elementos usam entrada suave escalonada. O zoom é discreto; o movimento deve apoiar a ideia.

O comando `planejar` cria cenas iniciais apenas se elas não existirem. Depois, atualiza `trabalho/plano-cenas.md` a partir do plano existente, sem apagar o trabalho criativo do agente. Ele não ajusta automaticamente os tempos de cenas se você mudar os cortes.

## Mídia, som e custo

Os três sons incluídos são sintetizados no setup com FFmpeg. Cada cena pode usá-los opcionalmente. Quando o cliente pedir música e fornecer um arquivo autorizado, adicione `music: "elementos/trilha.mp3"` e `musicVolume: 0.035` no `job.json`. A faixa toca em loop, com volume baixo configurável; não há ducking automático. Ouça a mistura para preservar a voz. Sem `music`, não há trilha.

O render copia somente o take e os assets usados para `trabalho/remotion/public/versions/<hash>/`, com endereços por conteúdo. Versões anteriores ficam no cache para não quebrar a última prévia válida. O cache pode ser limpo quando Studio/render estiverem fechados; o próximo preparo o recria. Não disponibiliza toda a pasta do cliente no Studio. Usa cópias, preservando o original. Exportações têm data e não são sobrescritas. JSONs de decisão guardam cópias em `revisoes/` antes de alterações feitas pelos scripts; se o agente editar JSONs diretamente, deve salvar uma revisão antes.

O processamento de mídia e reconhecimento são locais. Nenhum comando chama API de IA nem inicia outro agente. Codex/Claude é quem interpreta o briefing e modifica os arquivos ao ser solicitado. Uploads, geração paga e publicação exigem autorização específica.

## Qualidade e limites da base

`validar` verifica estrutura, tempos, arquivos, origem do take e continuidade das cenas. O render verifica áudio, duração e resolução e salva uma medição de loudness no relatório. A aprovação final inclui os hashes da mídia utilizada, os dados do render e o código do método que gera a composição: alterar qualquer um exige nova revisão.

Isso não substitui assistir e ouvir. Confira: palavras e números, cortes sem sílabas perdidas, foco do rosto, contraste, leitura no celular, assets corretos e som sem encobrir a voz. Esta versão não inclui remoção de fundo, diarização, redução de ruído, rastreamento de rosto ou geração automática de imagens.

Para motion específico fora dos tipos e componentes disponíveis, crie um componente determinístico no Remotion, revise seu efeito sobre os demais trabalhos e rode `check`, os testes e uma renderização de demonstração. Mantenha fontes/dados com a produção e o código reutilizável no método.


## Extensões 0.2.0 (opcionais, dados v1 preservados)

### Tema, revisão e montagem própria

`job.theme` guarda o tema da produção; `job.revision` tem padrão `r01`. Para montagens próprias, `rendering: {"type":"custom","project":"edicao/minha-montagem","composition":"MinhaComposicao"}` identifica o projeto relativo e a composição. Os comandos centrais recusam operar nessa montagem e também detectam diretórios `edicao/remotion-*` para evitar usar a raiz histórica. Não execute `iniciar` numa produção já existente.

`revisao --nome r02` copia decisões/transcrição para uma pasta datada em `revisoes/`, muda a revisão e torna as cenas rascunho. Não é backup de mídia/código. `previa` salva `trabalho/ultima-previa.json`; `aprovar` exige que seu fingerprint corresponda ao estado atual. Alterar o método invalida aprovações da base: gere/revise uma nova prévia. Aprovações históricas de montagens próprias não são migradas.

### Legendas, posição e imagem do apresentador

Campos opcionais de cada cena:

- `captionMode: "show" | "hide"`: padrão mostrar.
- `captionSuppression: [{"start":2,"end":3}]`: intervalos em tempo EDITADO global, dentro da cena. Não existe supressão automática por similaridade de texto.
- `framing: {"x":50,"y":45}`: foco percentual da cena, substitui o foco global.
- `zoom`: comportamento antigo preservado (rampa de 1 até zoom). Com `zoomTo`, a rampa parte de `zoom` até `zoomTo` (máximo 2). Não usa rastreamento facial.
- `viewport: {"x":90,"y":825,"width":840,"height":485,"radius":36}`: retângulo em pixels do vídeo 1080×1920; deve caber no quadro.
- `presenter: "hide"`: oculta somente a imagem, preservando voz e duração. Não remove fundo nem gera máscara.

Mantenha cabeça e mãos dentro do recorte. Recortes 4K permitem aproximação, mas não recuperam partes que não foram gravadas.

### Composição de cards, telas e conexões

`type: "composition"` usa o quadro inteiro para elementos. Outros tipos também aceitam `elements` por cima/atrás da imagem, além dos gráficos normais. O título continua obrigatório no JSON para identificar a intenção no plano.

```json
{
  "id":"conexao","start":0,"end":5,"type":"composition",
  "title":"Perfis conectados ao produto","presenter":"hide",
  "captionMode":"hide",
  "elements":[
    {"id":"perfil","kind":"card","title":"Profissional","x":90,"y":500,"width":330,"height":220,"rotateY":12},
    {"id":"app","kind":"screen","image":"interface/perfil.png","x":570,"y":400,"width":330,"height":700,"enter":0.3}
  ],
  "connections":[{"from":"perfil","to":"app","enter":0.7}]
}
```

`interface/perfil.png` precisa existir. `kind` pode ser `card`, `screen` ou `label`; `screen` exige imagem. `title` e `subtitle` são opcionais nos elementos. Imagens são incluídas no fingerprint. Não invente captura real.

Coordenadas `x,y,width,height` são pixels; `rotateY` fica entre −60 e 60 graus. `depth` é ordem de camada: negativo atrás do retângulo do vídeo, zero/positivo à frente; não é profundidade física. Vídeo opaco continua ocultando o fundo, portanto composição ao redor do corpo exige máscara/transparência preparada quando necessário. Não há remoção de fundo.

`enter` e `keyframes[].time` são segundos LOCAIS desde o início da cena. Exemplo de movimento: `keyframes: [{"time":0,"x":90,"y":500},{"time":2,"x":150,"y":600}]`. Tempos devem crescer e caber na cena. O movimento interpola posições, sem detectar mãos. Conexões usam IDs existentes e seus centros animados; confirme a leitura e a relação com os gestos.

### Mapa de gestos

`gestos` cria um arquivo vazio com hash da entrada. Preencha `edicao/gestos.json` após observar o vídeo:

```json
{"version":1,"sourceSha256":"SHA256_DA_ENTRADA","timebase":"original","gestures":[
  {"start":2,"end":3.2,"speech":"Apresento a ideia","gesture":"Palma aberta","action":"Revelar um card","evidence":"quadros do trecho"}
]}
```

Use o hash calculado pelo comando; não substitua para contornar uma troca de entrada. `planejar` gera `trabalho/mapa-gestos.md` com tempos originais/editados. Isso orienta a direção, sem criar keyframes automaticamente. Se o take mudar, revise mapa, transcrição e cortes.

### Sincronização e aprendizados

`studio` sincroniza configurações, transcrição e assets utilizados; não toma decisões criativas. Se um arquivo estiver inválido, confira o motivo em `trabalho/studio-estado.json`. A trava de edição é curta. O Studio mantém uma trava própria até encerrar; confira PID antes de remover trava abandonada. O polling não certifica qualidade visual. `sincronizar` força a atualização dos dados, sem gerar MP4.

`aprender --titulo ... --observacao ... --proposta ... [--evidencia ...]` salva proposta JSON em `aprendizados/` da produção. Para consolidar em código/instruções, siga [novos projetos](novos-projetos.md). Não há atualização ou treinamento automático.
