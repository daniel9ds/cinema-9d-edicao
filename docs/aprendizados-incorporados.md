# Melhorias incorporadas — 0.4.0

Orquestração local com direção do agente ativo: quantidade exata de versões, planos congelados, pastas isoladas, retomada, galeria, revisão criativa ligada aos hashes das prévias e aprovação humana separada. Estilos próprios nascem em rascunho, recebem estudo e registro; kits locais levam apenas a lista selecionada de materiais. Legendas progressivas também respeitam os tokens do perfil.

Os scripts não entendem a fala nem observam gestos sozinhos. O agente analisa a gravação e toma as decisões. As propostas de aprendizados continuam separadas das regras incorporadas. Higgsfield e outros provedores pagos permanecem opcionais e dependem de autorização.

Leia `ORQUESTRACAO.md`, `CRIAR-ESTILO.md` e `VALIDACAO-0.4.0.md`. Nenhuma produção antiga é migrada. A biblioteca de marca é privada e fica fora do método. Não há publicação automática.

## Histórico 0.3.0

# Melhorias incorporadas — 0.3.0

Consolidação local do perfil BookCasting 1.0.0 e validação da base em 28/10/2026. Veja `ESTILOS.md`, o README do perfil e `validacao-base-0.3.0.json` para a evidência técnica desta etapa.

- Catálogo de perfis com schema e versões; aplicação explícita e snapshot fixado por SHA-256 em cada produção.
- Primeiro perfil: paleta, tipografia, movimento, cards/ícones, conexões, lettering com altura fixa, revelação central de marca e legendas em frases.
- Receitas documentadas com parâmetros por gravação, sem copiar mídia, texto ou tempos da produção de referência.
- Proteção contra identidade de outra marca e alteração de estilo em revisão com prévia existente.
- Verificação do SHA do próprio MP4 da prévia antes da aprovação, além do fingerprint de código/dados/assets.
- Rotina de validação local com fixtures, testes, renders, transcrição e Studio temporário, incluindo falhas deliberadas. Aprovações da rotina são sintéticas.
- Estado de Studio encerrado explícito e opção `--no-open` para validação sem abrir abas.

Naquele estágio, orquestração, criação assistida de novos estilos e variantes em lote estavam pendentes; foram acrescentados em 0.4.0. Aprovação do anúncio R10, validação técnica do perfil e aprovação estética de novas prévias são estados distintos.

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
