# Melhorias incorporadas — 0.4.0

Orquestração local com direção do agente ativo: quantidade exata de versões, planos congelados, pastas isoladas, retomada, galeria, revisão criativa ligada aos hashes das prévias e aprovação humana separada. Estilos próprios nascem em rascunho, recebem estudo e registro; kits locais levam apenas a lista selecionada de materiais. Legendas progressivas também respeitam os tokens do perfil.

Os scripts não entendem a fala nem observam gestos sozinhos. O agente analisa a gravação e toma as decisões. As propostas de aprendizados continuam separadas das regras incorporadas. Higgsfield e outros provedores pagos permanecem opcionais e dependem de autorização.

Leia `ORQUESTRACAO.md`, `CRIAR-ESTILO.md` e `VALIDACAO-0.4.0.md`. Nenhuma produção antiga é migrada. A biblioteca de marca é privada e fica fora do método. Não há publicação automática.

## Geração com o Google (0.4.0, complemento)

Guia `GERACAO-GOOGLE.md` para os servidores MCP `genmedia-*` (Veo, Omni, Nano Banana, Gemini, Lyria, Chirp3, avtool). O guia exige aprovação explícita por geração e pergunta de formato. Os downloads vão para `geracao/brutos/` da produção. Comando local `bin/cinema-geracao` (`registrar`, `usar`, `descartar`, `status`) com manifesto `geracao/manifesto.json`: prompt, modelo, proporção, duração, custo estimado, aprovação e SHA-256 dos arquivos. O comando não chama provedores. `scripts/generation.ts` fica fora do fingerprint de render, então prévias, lotes e aprovações existentes continuam válidos.

Limites: o renderizador central não tem cena de B-roll em vídeo. Vídeo gerado entra como still, por montagem própria ou por uma futura extensão do `SceneSchema`. Narração em primeiro plano também exige montagem própria. O custo registrado é estimativa do agente, não o faturamento.

## Sonoplastia (guia opcional)

Guia `SONOPLASTIA.md`, usado só quando o pedido inclui sonoplastia. Organiza o mapa de sons no plano de cenas, as fontes (arquivos fornecidos, sons do `setup`, banco local do Earshot e biblioteca Openverse), as regras de licença (CC0 preferido, CC BY com crédito, sem NC em trabalho comercial), o registro em `elementos/sons/CREDITOS.md` e a escuta antes da aprovação. Origem: ferramentas apresentadas por Cauhi (autor do Bolo de Camadas) num vídeo sobre som para vídeos feitos com IA.

Limites: nenhum comando do método busca, baixa ou instala sons; o agente faz isso com autorização. O renderizador continua com um som por cena, iniciado no começo da cena, sem ducking. O Earshot não foi validado pelo método. Uma terceira ferramenta citada no vídeo (Real SFX) não foi incluída porque não foi possível verificá-la. Sem mudança de código nem de fingerprint.

## Painel anamórfico com Blender (guia experimental)

Guia `ANAMORFICO-BLENDER.md`, generalizado de um único projeto real de painel LED 3D curvo: briefing mínimo, etapas (geometria do painel, câmera no ponto ótimo, render, desembrulhar, vídeos e simulado no prédio), modelos 3D gerados por IA, render longo, acompanhamento pelo MCP do Blender, aprovação com o cliente e serviços pagos. A skill aponta para o guia quando o pedido fala em anamórfico ou LED 3D.

Limites: fica fora do pipeline de edição de fala. Nenhum comando, esquema ou teste do método implementa o fluxo, e as observações técnicas do Blender não foram validadas aqui. A aprovação é registrada por escrito, sem o hash de `aprovar`. Os scripts do projeto original não entram no repositório; generalizá-los exige implementação, fixtures sintéticas e autorização. A skill e os docs ficam fora do fingerprint de render, então produções existentes não mudam.

## Publicação do repositório (0.4.0)

O catálogo central passa a trazer o perfil neutro `exemplo` 1.0.0, com a identidade padrão do método. Ele é o padrão de `demo-estilo` e a base de `estilo-criar`. Perfis e estudos de marcas específicas saem do repositório e ficam na biblioteca local de quem os criou. Produções existentes não mudam, porque cada uma guarda o snapshot do seu estilo; como o código mudou, produções da base sem aprovação precisam de nova prévia antes de aprovar.

O README passa a usar painéis largos (1600 px) com arte de fundo gerada por IA (Codex, sem pessoas reais nem telas reais) e textos e diagramas vetoriais gerados por `docs/assets/readme/gerar.mjs`, com animação CSS que para com `prefers-reduced-motion`. Os quadros sintéticos de `examples/` saíram do repositório: `demo`, `demo-estilo` e `previa` geram os mesmos resultados localmente. A prévia social do GitHub fica em `docs/assets/readme/social-preview.jpg` e é enviada à mão em Settings.

## Histórico 0.3.0

# Melhorias incorporadas — 0.3.0

Catálogo de perfis de estilo e validação da base em 28/10/2026. O primeiro perfil foi consolidado a partir de uma produção real; ele não faz parte do repositório público e foi substituído no catálogo pelo perfil neutro `exemplo` (veja `ESTILOS.md`).

- Catálogo de perfis com schema e versões; aplicação explícita e snapshot fixado por SHA-256 em cada produção.
- Primeiro perfil: paleta, tipografia, movimento, cards/ícones, conexões, lettering com altura fixa, revelação central de marca e legendas em frases.
- Receitas documentadas com parâmetros por gravação, sem copiar mídia, texto ou tempos da produção de referência.
- Proteção contra identidade de outra marca e alteração de estilo em revisão com prévia existente.
- Verificação do SHA do próprio MP4 da prévia antes da aprovação, além do fingerprint de código/dados/assets.
- Rotina de validação local com fixtures, testes, renders, transcrição e Studio temporário, incluindo falhas deliberadas. Aprovações da rotina são sintéticas.
- Estado de Studio encerrado explícito e opção `--no-open` para validação sem abrir abas.

Naquele estágio, orquestração, criação assistida de novos estilos e variantes em lote estavam pendentes; foram acrescentados em 0.4.0. Aprovação da produção de referência, validação técnica do perfil e aprovação estética de novas prévias são estados distintos.

## Histórico 0.2.0

### Melhorias incorporadas — 0.2.0

Atualização local de 27/10/2026. Código reutilizável, sem mídia ou dados de produção.

- Produções com temas independentes: `job.theme`, pasta de interface, quadros de referência e aprendizados locais. Inicialização preserva briefing/identidade existentes.
- Legendas: mostrar/ocultar por cena ou por intervalo editado; a decisão depende da informação realmente comunicada pelo lettering.
- Enquadramento: foco, viewport e escala por cena. Ocultar a imagem do apresentador mantém a voz. Não há rastreamento automático nem remoção de fundo.
- Componentes: cards, telas e textos com posições/keyframes, perspectiva e conexões. Profundidade negativa fica atrás do vídeo; positiva fica à frente. Integração com o corpo inteiro ainda exige mídia com transparência/máscara preparada e revisão.
- Gestos: registro de fala/gesto/ação com SHA da entrada e remapeamento para a edição. O mapa não é uma detecção automática e não gera keyframes sozinho.
- Studio: sincronização periódica, estado explícito de desatualização e trava separada da edição. Assets têm versão de conteúdo para evitar cache antigo.
- Revisões: cópia datada de decisões antes da mudança; status da revisão e exigência de prévia atual para aprovação. Detecção de montagens próprias evita operar na raiz histórica.
- Áudio/metadados: conversão de estéreo para mono por média, com folga, para evitar ganho na soma de canais idênticos; exportação sem metadados de origem.
- Aprendizados: notas locais estruturadas e procedimento de consolidação no método, sem incorporar preferências de um cliente como regra de todos.

Dependências mantidas. Não há migração automática de produções antigas, geração paga, upload ou publicação. Fingerprints/aprovações da base antiga precisam de nova prévia após mudança do método. Montagens próprias preservam seus scripts e sua aprovação histórica.

Verificação desta atualização: checagem estática TypeScript; não representa revisão visual, render ou avaliação criativa. Testes e render de demonstração não foram executados nesta atualização.
