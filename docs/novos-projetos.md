# Começar um projeto e evoluir o método

Cada produção tem seu tema, gravação, marca, telas e referências. Os comandos abaixo usam a instalação convencional em `~/projetos/cinema-9d-edicao`; se você clonou em outro lugar, substitua esse prefixo. A instalação central guarda código e procedimentos reutilizáveis; não guarda mídia de clientes. Você pode escolher qualquer pasta local e abrir o agente diretamente nela.

## 1. Criar a pasta

Exemplo (troque o caminho, nome e tema):

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/caminho/Meu novo vídeo" --nome "Meu novo vídeo" --tema "Apresentação de produto"
```

Se o vídeo já existir, acrescente `--video "/caminho/gravacao.mp4"`. O método copia o original externo sem apagá-lo; quando o vídeo já está dentro da produção, mantém seu caminho. Se iniciar sem vídeo, coloque-o em `entrada/video.mp4` ou ajuste `video` no `job.json` para o nome real. Não renomeie apenas a extensão de um arquivo.

```text
Meu novo vídeo/
├── AGENTS.md e CLAUDE.md     instruções para o agente
├── job.json                 vídeo oficial, tema e revisão
├── entrada/                 originais preservados
├── marca/                   identidade, logo, fontes
├── interface/               telas e capturas do produto
├── elementos/               imagens, objetos, sons e fontes usadas
├── referencias/frames/      vídeos e quadros de estilo
├── roteiro/briefing.md       objetivo, público e direção
├── edicao/                  decisões, cenas e mapa de gestos
├── trabalho/                transcrição, quadros e arquivos derivados
├── aprendizados/            propostas de melhoria desta produção
├── revisoes/                cópias de decisões anteriores
└── saida/                   prévias e finais
```

`revisoes/` surge conforme o trabalho muda. As referências orientam estilo; não se tornam automaticamente personagens, telas ou elementos da entrega. Explique o que aproveitar de cada uma. Para outro cliente ou campanha, crie outra produção; não reutilize o `job.json` e os hashes da anterior.

## 2. Abrir o agente na pasta da produção

Pedido para copiar:

> Use a skill cinema-9d-edicao e o método em ~/projetos/cinema-9d-edicao para esta produção. Leia AGENTS.md, job.json, roteiro/briefing.md e os materiais de entrada, marca, interface e referências. Confirme o vídeo oficial e o tema. Analise a fala e os gestos, proponha cortes, escolha enquadramentos e crie um plano visual com identidade própria. Aproveite movimentos reais e preserve a expressão de encerramento definida no briefing. Mostre o plano, quadros de composição e uma prévia no Remotion. Não sobrescreva revisões nem use geração paga ou upload sem autorização específica. Registre aprendizados verificáveis em aprendizados/, separando observação, proposta e evidência.

O agente pode editar briefing/roteiro antes da gravação. `preparar` exige o vídeo com áudio e produz um rascunho técnico; não cria direção profissional sozinho. O método não chama outro agente nem um serviço de imagem/vídeo automaticamente.

## 3. Preparar, compor e acompanhar

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao preparar "/caminho/Meu novo vídeo"
~/projetos/cinema-9d-edicao/bin/cinema-edicao gestos "/caminho/Meu novo vídeo"
# O agente revisa cortes, preenche gestos e compõe as cenas.
~/projetos/cinema-9d-edicao/bin/cinema-edicao planejar "/caminho/Meu novo vídeo"
~/projetos/cinema-9d-edicao/bin/cinema-edicao studio "/caminho/Meu novo vídeo" --porta 3099
```

O Studio sincroniza dados válidos a cada 1,5 s, usando trava curta. Pode permanecer aberto durante operações do agente. Se encontrar JSON incompleto, trava em uso ou outra inconsistência, conserva a última versão válida e informa o motivo no terminal e em `trabalho/studio-estado.json`. Confira esse estado antes de revisar. `sincronizar` atualiza manualmente os dados; não renderiza um MP4.

O endereço só funciona enquanto o Studio estiver rodando. O sistema não encerra outros servidores para liberar uma porta. Um Studio por produção; portas diferentes para produções simultâneas.

`previa` gera um MP4 com data, manifesto e registro em `trabalho/ultima-previa.json`. A aprovação precisa corresponder ao MP4 e aos dados atuais. Assistir e ouvir a prévia continua necessário.

## 4. Continuar e preservar revisões

Abra a mesma pasta da produção, leia as instruções e continue da revisão atual. Na base central, antes de alterar uma prévia já entregue:

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao revisao "/caminho/Meu novo vídeo" --nome r02 --nota "Revisar enquadramento e ritmo"
```

Esse comando guarda as decisões/transcrição anteriores em uma pasta datada, ativa `job.revision=r02` e volta as cenas a rascunho. **Não é um backup completo de mídia/código**: preserve os assets existentes e crie novos nomes ao alterá-los; faça uma cópia completa se precisar de recuperação independente. MP4s antigos permanecem em `saida/`.

Montagens próprias, como `edicao/remotion-r10`, têm seus próprios scripts e documentos. Configure opcionalmente `job.rendering` com `type: custom`, `project` relativo e `composition`. Os comandos centrais também detectam pastas `edicao/remotion-*` e recusam operar sobre a montagem histórica da raiz. `status` e `aprender` continuam disponíveis. Leia o documento atual; não escolha uma revisão apenas pelo maior número do diretório.

## 5. Trazer aprendizados da utilização

Sim: entre na pasta da produção, mostre ao agente o que funcionou e o que precisa melhorar. Registre uma observação concreta:

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao aprender "/caminho/Meu novo vídeo" --titulo "Legibilidade" --observacao "O texto encobriu a mão neste trecho" --proposta "Reservar espaço para a trajetória do gesto" --evidencia "Prévia r02, 12–14 s"
```

O comando salva uma proposta local com a versão do método; não modifica o método, não envia arquivos e não treina um modelo. Use `aprendizados/LEIA-ME.md` para registrar também evidências e contraexemplos. A pasta pode conter notas sobre clientes: revise e remova dados privados antes de compartilhar ou incorporar.

Para consolidar, abra **a pasta central** `~/projetos/cinema-9d-edicao` e peça:

> Analise os aprendizados da produção em /caminho/Meu novo vídeo. Confira as evidências e proponha o que pode ser reutilizado. Incorpore ao método as melhorias autorizadas de código, componentes e instruções, preservando compatibilidade. Mantenha preferências de tema na produção. Não copie mídia, marca, dados pessoais ou prompts privados do cliente para o método. Registre o que mudou e suas limitações.

A melhoria ocorre por procedimentos, componentes e padrões fundamentados na experiência. Uma preferência de um vídeo não deve virar regra universal. Gerações pagas, publicação e aprovação final continuam decisões específicas de cada produção.
