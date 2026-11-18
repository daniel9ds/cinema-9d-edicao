# Painel anamórfico 3D com Blender (guia experimental)

> **Fora do pipeline de edição de fala.** Nenhum comando de `bin/cinema-edicao` implementa este fluxo, e o Remotion, o Whisper, `preparar`, `previa`, `aprovar` e `final` não se aplicam aqui. Este guia registra o que funcionou num único projeto real de painel LED 3D curvo, feito com Blender, Python e FFmpeg. As observações técnicas não foram validadas pelo método nem por testes. Os scripts desse projeto não estão no repositório; o agente escreve os seus na pasta da produção.

Use este guia quando o pedido falar em painel anamórfico, LED 3D, "efeito 3D em fachada" ou vídeo para painel curvo. Os números abaixo são exemplos arredondados, não valores para copiar.

## 1. Briefing mínimo

Peça antes de começar:

- Medidas de cada face do painel (por exemplo lateral, curva e frente) em metros e o pitch em mm por pixel. Exemplo: três faces de 1 200, 240 e 2 400 px (3 840 px no total) com pitch de 4 mm, num arquivo de 3840×2160.
- Comprimento ou raio da curva. Numa curva de 90°, o raio é `comprimento / (π/2)`.
- Altura da base do LED em relação ao chão.
- Ponto ótimo do pedestre: distância, ângulo em relação à frente e altura do olho (cerca de 1,6 m). Exemplo: 50 m a 30°.
- Especificação do arquivo de entrega: codec, fps, duração, bitrate e áudio. Exemplo: H.264, 30 fps, 15 s, 10 Mbps, sem áudio.
- Foto do prédio com o painel, de preferência com o painel coberto de verde chroma, para o simulado.
- Formato das peças de apresentação (9:16, 16:9…). **Pergunte; não assuma.**
- Autorização de uso das fotos, marcas e produtos que vão aparecer.

## 2. Pipeline por etapa

| Etapa | O que faz |
|---|---|
| Geometria do painel | Descreve o painel numa coordenada única `s` ao longo da superfície (faces planas e arcos) e devolve posição, normal e tangente. Só as constantes mudam de um painel para outro. |
| Cena e câmera | Câmera no olho do pedestre, mirando a quina. A ilusão só fecha desse ponto. |
| Render | Cycles na GPU. Prévia com resolução e amostras reduzidas (no projeto: 40% e 32 amostras); final em resolução cheia (no projeto: 64 amostras). |
| Desembrulhar | Para cada pixel do LED: ponto 3D no painel → projeção na câmera do ponto ótimo → amostra do render. Supersampling 2× e redução por área para não serrilhar. Gera o arquivo plano do LED. |
| Vídeos | FFmpeg: arquivo do painel na especificação pedida e uma "vista do pedestre" em 1080p para conferência. |
| Simulado no prédio | Localiza o contorno verde do painel na foto, projeta os mesmos vértices reais na câmera do ponto ótimo, ajusta uma homografia e encaixa o conteúdo só dentro da máscara, com borda suave. |

Teste o desembrulhar e a homografia com uma grade xadrez antes de qualquer arte.

Recursos de linguagem que funcionaram: uma **moldura 3D fixa** no painel, com os elementos saindo dela, e a **cartela final recuada** para dentro da moldura. Cartela rente à moldura parece 2D.

## 3. Modelos 3D gerados por IA

Modelos gerados a partir de fotos por serviços de IA costumam trazer: malha em triângulos soltos e com buracos, textura com aspecto de pincelada, diferenças de 1 a 2 cm em relação à foto e peças móveis (por exemplo, rodas) que trazem pedaços vizinhos junto.

Funcionou:

- Calibrar uma câmera que case a silhueta do modelo com o alfa da foto real e **projetar a foto** sobre o modelo.
- Corrigir **por região estreita**, só onde está o defeito.
- Alisar as **normais** (média num raio pequeno, preservando quinas) para tirar o aspecto amassado sem mudar a forma.
- Trocar detalhes deformados por uma **placa fina com a foto real** e máscara de borda suave.
- Ajustar superfícies de vidro e áreas lisas **por vértices**, com raycast, onde a malha tinha relevo falso.
- Separar das peças móveis os pedaços que não se movem.
- Usar um único preto para todos os plásticos.

Não funcionou (evite):

- Pintar cor chapada em áreas grandes: perde a aparência de foto.
- Criar peças 3D que não existem no objeto real.
- Limpeza global da textura.
- Gerar o ambiente 3D por IA: uma foto plana do ambiente funcionou melhor.
- Empilhar correções sobre correções. Quando uma rodada piora, volte à última versão aprovada e leve só os acertos.

Armadilhas técnicas observadas no Blender:

- Uma imagem salva pelo numpy dentro do Blender volta como sRGB. Para um preto exato, passe uma máscara no alfa e misture no shader.
- Ao reexecutar um script, limpe só os nós internos de um grupo de nós, nunca a `interface`, senão os materiais se desligam.
- O nó Mix tem uma saída `Result` numérica e outra de cor. Ligue a do tipo cor.
- Deixe os scripts **reexecutáveis**: no início, restaure o estado-base (por exemplo, os índices de material) a partir de uma cópia de backup, não do `.blend` aberto.
- Fixe `scene.camera` no script. Uma câmera de inspeção salva como câmera da cena gera quadros de aprovação no ângulo errado.

## 4. Render longo

- Reaproveite quadros que não mudaram. Na prévia, renderize só a cena alterada.
- **Vigia de travamento:** se nenhum quadro novo sair em X segundos, encerre e retome do primeiro quadro que falta. Conte o tempo a partir do início do processo, não do último arquivo da pasta; com a pasta vazia, o vigia mataria o render antes do primeiro quadro.
- **Vazamento de memória:** no projeto, o uso de memória do Blender cresceu sem parar num render longo. Renderizar em **blocos curtos** (no projeto, 20 quadros), reiniciando o Blender a cada bloco, manteve a memória estável.
- Feche programas pesados e impeça que o Mac durma durante o render.
- Antes de entregar, valide com `ffprobe` (resolução, fps, número de quadros, duração e ausência de áudio) e confira 3 quadros: abertura, meio e final.

## 5. Acompanhar no Blender ao vivo (MCP)

O add-on MCP do Blender só sobe com acesso online habilitado, por exemplo:
`Blender --online-mode arquivo.blend --python-expr "<habilita o add-on e inicia o servidor num timer>"`. No projeto, o servidor escutou na porta local 9876. Esse Blender aberto é separado do render em segundo plano e pode ser fechado sem afetá-lo. Não exponha essa porta fora da máquina.

## 6. Aprovação com o cliente

Neste fluxo a aprovação **não** passa por `aprovar`/`final` e não fica ligada a hash. Registre por escrito, na pasta da produção, quem aprovou, quando, o que e em que versão. Nunca registre aprovação em nome do usuário ou do cliente.

1. Frame de aprovação antes de animar: sempre o mesmo quadro, em 3 imagens (vista do ponto ótimo, close e simulado no prédio).
2. O cliente marca os erros num print. Combine antes o que cada marca significa.
3. Para localizar a marca no 3D: registre o print sobre o frame (template matching em várias escalas) e lance raios da câmera nos pontos marcados para descobrir face, objeto e material.
4. Monte um checklist numerado e confirme com o cliente antes de corrigir. Um item por vez, com "antes | depois".
5. Renderize a animação só depois de o cliente ver a última mudança. "Continue com o recomendado" não autoriza render.
6. Prévia aprovada → final em resolução cheia.

## 7. Serviços pagos

O projeto de referência usou serviços pagos para ampliar fotos, gerar modelos 3D a partir de fotos (vale testar 2 ou 3 modelos) e gerar um vídeo curto para uma tela dentro da cena. Siga as regras do método: consulte o custo antes, mostre ao usuário e só chame com pedido explícito para aquela geração. Envio de foto de produto ou de cliente é upload e exige autorização. Para os servidores do Google, veja [geração com o Google](GERACAO-GOOGLE.md).

## Origem e limites

- Um único projeto real, generalizado sem nomes, materiais ou dados do cliente.
- Nenhuma etapa tem comando, esquema ou teste no método. Se o fluxo for repetido, o próximo passo é transformar as etapas estáveis (geometria, desembrulhar, simulado, vigia de render) em scripts genéricos com fixtures sintéticas. Isso exige implementação e revisão separadas.
