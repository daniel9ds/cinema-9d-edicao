# Melhorias incorporadas — 0.2.0

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
