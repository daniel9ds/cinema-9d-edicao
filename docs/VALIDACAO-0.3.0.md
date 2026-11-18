# Validação da base 0.3.0 e perfil BookCasting 1.0.0

Em 28/10/2026, passaram 20 testes e 13 etapas de validação local. [Relatório estruturado](validacao-base-0.3.0.json).

## Cobertura técnica

TypeScript; schemas e compatibilidade antiga; snapshot/hash do perfil; legendas e supressão por trecho; prévias com áudio; comparação de pixels da faixa de legenda; bloqueio de prévia adulterada e mudanças após aprovação; render nativo 1080×1920; preservação das entradas; revisão e mapa de gestos; proteção de montagem própria; saída a 60 fps com dois cortes; sincronização do Studio e recuperação de JSON inválido; trava curta, segundo Studio bloqueado e encerramento; transcrição em CPU de fala sintética em português.

A transcrição reconheceu 14 palavras. Não houve chamadas pagas, novas gerações IA ou alterações na produção de referência. Seu MP4 final R10 mantém o SHA-256 do registro aprovado.

## Inspeção visual

Foram inspecionados PNGs dos quadros 30, 150, 240, 300 e 420 do estudo, verificando lettering, cards/conexões, sequência de revelação, interface ilustrativa, legendas e enquadramento. O teste de supressão comparou a luminância na faixa da legenda com/sem o componente.

[Estudo técnico em vídeo](../examples/bookcasting-estilo-1.0.0-estudo.mp4) · [Lettering](../examples/bookcasting-estilo-1.0.0-lettering.png) · [Conexões](../examples/bookcasting-estilo-1.0.0-conexoes.png) · [Tela](../examples/bookcasting-estilo-1.0.0-tela.png)

A trilha do estudo é um tom de teste, não música nem a voz de uma pessoa. O logo, a interface e o vídeo são sintéticos. A fonte Figtree foi fornecida à fixture, sem redistribuição do arquivo. O estudo não demonstra remoção de fundo nem qualidade de uma gravação humana ou geração IA.

## Estado

Base validada tecnicamente e quadros inspecionados. Aprovação estética do pacote visual e aprovação de futuros anúncios permanecem específicas. O teste de aprovação/finalização utiliza somente decisões sintéticas, identificadas no relatório; não registra aprovação em nome do usuário.

Orquestração e variantes em lote não foram implementadas. Esta etapa foi instalada localmente, sem nova publicação GitHub. Veja [o guia do perfil](../styles/bookcasting/1.0.0/README.md) para aplicar a linguagem em outra gravação.
