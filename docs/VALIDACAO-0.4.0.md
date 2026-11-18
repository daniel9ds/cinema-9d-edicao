# Validação local — 0.4.0

Verificação em 28/10/2026, sem chamadas pagas, upload ou alteração de mídia de cliente. Os registros de revisão/aprovação criados pelas rotinas têm rótulo explícito de teste e usam somente áudio/vídeo sintéticos.

- TypeScript: aprovado.
- Testes unitários/regressão: 26 aprovados.
- Base existente: 13 etapas aprovadas, incluindo prévias, final nativo, cortes descontínuos a 60 fps, supressão de legendas, aprovação ligada ao MP4, transcrição real de fala sintética via Whisper CPU e sincronização/recovery de Studio.
- Orquestração: 11 etapas aprovadas, incluindo duas versões independentes, prévias 540×960, finais 1080×1920 com áudio, contagem exata, bloqueio de direção duplicada/inválida, revisão criativa obrigatória, retomada sem repetir prévias/finais concluídos, adulteração de MP4, alteração de briefing/plano e preservação de lotes/originais.
- Estilo próprio: rascunho neutro, estudo com legenda progressiva, bloqueio de final em rascunho, rejeição de registro após mudar o perfil, registro ligado ao estudo, versão imutável e aplicação em nova produção.
- Kit: lista explícita, hashes, aplicação sem sobrescrever identidade, rejeição de adulteração, proteção contra caminhos externos e exclusão de gravações não listadas.

Os quadros sintéticos das duas versões e do estilo próprio foram inspecionados: mostram as diferenças de composição e de legenda, sem representar uma peça publicitária pronta. O teste de estilo sem fonte fornecida usa fallback; a regressão da base recebe uma fonte local. Um kit local do operador também foi aplicado e renderizado em uma produção sintética nova: logo e fonte presentes nos assets verificados, quatro materiais selecionados, enquadramento, legenda e marca inspecionados no quadro resultante.

Evidências estruturadas: [base](validacao-base-0.4.0.json) e [orquestração](validacao-orquestracao-0.4.0.json). As rotinas preservam fixtures em pastas temporárias e reportam seus caminhos; esses caminhos não são exemplos de produção permanente.

Reproduza com `npm run check`, `npm test`, `npm run validar:base -- --font /caminho/figtree.woff2` e `npm run validar:orquestracao`. Renders e Studio precisam do navegador/dependências configurados por setup e portas locais disponíveis. Nenhuma dependência nova foi adicionada nesta versão.

Esta evidência confirma comportamento técnico e gates. Não comprova direção criativa autônoma por script, aprovação estética do usuário, tracking, recorte automático de pessoa, troca de roupa ou geração de IA. O agente ativo precisa analisar/revisar cada gravação e o usuário aprovar as prévias atuais.

## Nova execução — 18/11/2026 (perfil `exemplo`)

Depois da troca do perfil de exemplo do catálogo pelo perfil neutro `exemplo` 1.0.0, as rotinas foram repetidas sem fonte fornecida (fallback de fonte), sem chamadas pagas e só com mídia sintética:

- TypeScript: aprovado. Testes: 26 aprovados.
- Base: 13 etapas aprovadas ([relatório](validacao-base-0.4.0.json)). A checagem de supressão de legenda passou a aceitar diferença de luminância em qualquer direção, porque o perfil novo tem fundo escuro.
- Orquestração: 11 etapas aprovadas ([relatório](validacao-orquestracao-0.4.0.json)).
- Estudo do perfil `exemplo` gerado com `demo-estilo` e `previa`; os quadros foram inspecionados visualmente. Eles não ficam no repositório; rode `demo-estilo` e `previa` para gerá-los de novo.

Os relatórios versionados refletem esta execução. Os resultados de 28/10/2026 descritos acima foram obtidos com o perfil anterior.
