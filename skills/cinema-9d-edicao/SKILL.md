---
name: cinema-9d-edicao
description: Edita gravações de fala com o método Cinema 9D, usando pastas independentes, transcrição local, cortes rastreáveis, legendas e motion no Remotion. Use para produzir ou revisar uma edição com este método.
---

# Cinema 9D Edição

Localize a instalação central pela pasta real desta skill: ela fica em `skills/cinema-9d-edicao/` dentro do método. O caminho habitual é `~/projetos/cinema-9d-edicao`; se houver um vínculo global, resolva-o antes de escolher a raiz.
O usuário escolhe a pasta de cada produção. Use o executável `bin/cinema-edicao` desse método com o caminho absoluto do trabalho.
Leia [o método e os formatos](../../docs/metodo.md) antes de criar ou modificar cortes/cenas.
Para iniciar outra produção/tema ou consolidar aprendizados, leia [novos projetos](../../docs/novos-projetos.md).

## Entrada e análise

Se a produção ainda não existe, execute `iniciar "/pasta"` (opcional `--tema "Tema"` e `--video "/origem/take.mp4"`). Leia `job.json`, as instruções/documento de continuidade atuais, `roteiro/briefing.md`, `marca/identidade.json`, `interface/` e as referências relevantes. Tema e identidade pertencem à produção. Se houver `job.rendering` ou montagem `edicao/remotion-*`, use seus scripts: a configuração da raiz pode ser histórica. Não reinicie por cima de uma composição própria.
O vídeo fica em `entrada/`, ou em outro caminho relativo configurado no `job.json`. Preserve o original.
Execute `preparar "/pasta"`, leia a transcrição palavra a palavra e inspecione `trabalho/frames/`. Extraia mais quadros quando precisar conferir um gesto, corte ou referência. A amostragem de seis quadros não substitui a análise dos momentos relevantes.
O Whisper small multilíngue roda na máquina; revise nomes, números e palavras omitidas. Se o áudio ou a transcrição não permitirem uma decisão, indique o trecho incerto em vez de inventar uma fala.

## Cortes e direção

`edicao/cortes.json` começa com uma proposta por silêncio. Revise ouvindo os limites e preserve sílabas, respirações naturais, intenção e continuidade. Retire repetições/erros só quando o contexto justificar. Os cortes usam segundos do original e precisam permanecer ordenados. `planejar` remapeia as legendas para o vídeo editado.
Se mudar cortes, recalcule a duração e ajuste todos os tempos de `edicao/cenas.json`. Eles usam a linha de tempo da edição. Rode `planejar` para atualizar a tabela; o comando preserva cenas existentes.
Transforme o rascunho em cenas com função: uma ideia por cena, visual que explica a fala, entrada na palavra relevante. Use os tipos disponíveis ou amplie o renderizador com componentes locais quando o trabalho justificar; declare mudanças ao método compartilhado. Não apresente os blocos automáticos de texto como direção criativa final.
O gancho deve ser legível no primeiro quadro. Preserve margens para a interface do canal; ajuste a posição do rosto em `job.json`. O método faz recorte com foco fixo configurável, sem rastreamento automático de rosto.
Use `framing`, `viewport` e `zoomTo` por cena quando necessário. `presenter: hide` oculta a imagem e mantém a voz. Observe os gestos antes de compor: `gestos` cria `edicao/gestos.json` com tempos originais e `planejar` remapeia os intervalos. Keyframes e máscaras exigem trabalho explícito; não prometa rastreamento ou recorte automático.
Use `captionMode`/`captionSuppression` para evitar legenda redundante com lettering. Uma palavra de destaque não substitui a informação de toda a frase. Cards, telas e conexões podem usar `elements`/`connections`; consulte os formatos, sem criar campos ignorados pelo renderizador.
Use marca e arquivos reais fornecidos. Métricas e barras exigem valores com fonte. Marque ilustrações/simulações. Não invente prints, números ou resultados.
Sons são opcionais e devem vir de arquivos autorizados. Música só quando pedida; mantenha voz clara. Um som por movimento é uma referência de estilo, não obrigação para todas as edições.

## Revisão e entrega

Mostre `trabalho/plano-cenas.md` para alinhar a direção. Rode `validar` e `previa`; inspecione os PNGs e a prévia para sincronização, enquadramento, leitura e ritmo. Verifique os pontos de corte com áudio. A checagem automática de duração/áudio/resolução não prova qualidade criativa ou exatidão da transcrição.
O Studio sincroniza dados com trava curta; confira `trabalho/studio-estado.json`. Em erro, a tela conserva dados anteriores e não deve ser anunciada como atual. Antes de alterar uma prévia entregue, use `revisao --nome r02` na base central; preserve código e assets separadamente. O snapshot de decisões não é um backup completo.
Itere conforme o feedback. Quando a direção estiver revisada, marque `edicao/cenas.json` com `status: "reviewed"`.
Após o usuário aprovar a prévia atual, registre `aprovar "/pasta" --por "Nome"` e execute `final "/pasta"`. Nunca registre aprovação em nome de alguém sem esse OK. Qualquer mudança de mídia, marca, legenda, corte ou cena invalida o registro.
Entregue o caminho do MP4, informe a revisão realizada e qualquer limitação concreta. Guarde os materiais e as exportações na produção. Não publique automaticamente.

## Aprender com a utilização

Quando solicitado, registre observação, proposta e evidência em `aprendizados/` da produção (`aprender` cria uma nota estruturada). Isso não atualiza o método nem treina o modelo. Para consolidar, confira evidências, separe preferência do tema de regra reutilizável e modifique a instalação central apenas com autorização. Não copie mídia ou dados privados. Consulte `docs/aprendizados-incorporados.md` para as melhorias já existentes.

## Referência

O método amplia a proposta de cinco camadas do [Bolo de Camadas, de pcauhi](https://github.com/pcauhi/bolo-de-camadas). Cópia MIT com crédito em `vendor/skills/bolo-de-camadas`. Consulte somente o nicho útil. A referência parte de take já cortado; este método acrescenta proposta de corte e mapeamento dos tempos.
