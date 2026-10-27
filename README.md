# Cinema 9D Edição

Método reutilizável para transformar uma gravação de fala em vídeo vertical com cortes, legendas sincronizadas, identidade visual e motion no Remotion. Cada trabalho pode ficar em qualquer pasta do computador, separada desta instalação central.

## Instalar em outra máquina ou pasta

```bash
mkdir -p ~/projetos
git clone https://github.com/daniel9ds/cinema-9d-edicao.git ~/projetos/cinema-9d-edicao
cd ~/projetos/cinema-9d-edicao
npm ci
npm run setup
npm run instalar:skill
npm run doctor
```

Instale antes Node.js 20+, FFmpeg/FFprobe e Whisper.cpp. No macOS com Homebrew: `brew install node ffmpeg whisper-cpp`. O repositório privado exige acesso à conta/credencial GitHub. Não coloque tokens em arquivos do método.

Pode clonar em outro caminho: adapte o prefixo dos comandos. O executável resolve a raiz automaticamente. O instalador de skill cria vínculos para esta instalação em `~/.codex/skills` e `~/.claude/skills`, preservando vínculos existentes para outra instalação. Reabra o agente para redescobrir a skill. O setup usa comandos de sistema Unix; Windows nativo não foi validado.

Para atualizar uma instalação clonada sem alterações locais: `git pull --ff-only` e `npm ci`. Depois confira [atualização e limites](docs/ATUALIZACAO.md) antes de continuar uma edição.

## Usar com Codex ou Claude Code

Para editar, abra o agente na pasta da produção e use a skill instalada `cinema-9d-edicao`. Para melhorar o método, abra esta instalação central. Diga:

> Use o método Cinema 9D Edição para o trabalho em `/caminho/da/minha-edicao`. Meu vídeo e os materiais estão nessa pasta. Prepare os cortes, leia o briefing, crie as telas conforme a fala e me mostre o plano e a prévia.

O agente conduz a direção criativa e chama os scripts locais. O comando `preparar` sozinho gera uma proposta técnica e um rascunho, que precisam ser revisados.

## Primeiro trabalho

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/caminho/da/minha-edicao" --nome "Minha edição" --video "/caminho/do/take.mov"
```

Também pode iniciar sem `--video` e colocar o arquivo em `entrada/video.mp4` depois. Para outro nome/formato, ajuste `video` no `job.json`.

Coloque a marca em `marca/`, telas em `interface/`, imagens e sons em `elementos/`, referências em `referencias/` e preencha `roteiro/briefing.md`. Um roteiro de fala opcional pode ir em `roteiro/fala.txt`.

```text
minha-edicao/
├── job.json
├── entrada/                 gravação original preservada
├── marca/identidade.json    cores, fonte, logo
├── interface/              telas do produto
├── elementos/              imagens, sons e outros materiais
├── referencias/            vídeos e imagens de referência
├── roteiro/briefing.md      objetivo, público e preferências
├── edicao/                 cortes, cenas e aprovação desta revisão
├── trabalho/               transcrição, quadros, plano e cache
├── aprendizados/           observações e propostas locais
└── saida/                  prévias e exportações finais
```

## Novos temas e aprendizados

Cada produção pode ter tema, identidade e referências próprios, em qualquer pasta. Use `iniciar --tema "Tema"`. Consulte [o guia de novos projetos e aprendizados](docs/novos-projetos.md). A versão local **0.2.0** incorpora as melhorias descritas em [aprendizados incorporados](docs/aprendizados-incorporados.md).

Abra o agente na produção para editar ou registrar experiência; abra o método central para consolidar melhorias reutilizáveis. `aprender` registra uma proposta local, sem treinamento automático nem alteração do método.

## Comandos locais

Use o caminho completo do executável; ele funciona a partir de qualquer pasta do terminal.

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao preparar "/caminho/da/minha-edicao"
~/projetos/cinema-9d-edicao/bin/cinema-edicao previa "/caminho/da/minha-edicao"
~/projetos/cinema-9d-edicao/bin/cinema-edicao studio "/caminho/da/minha-edicao"
```

O Studio sincroniza dados a cada 1,5s sem manter a trava de edição; confira `trabalho/studio-estado.json` para saber se a tela está atual. `sincronizar` força uma atualização. A aprovação exige uma prévia MP4 correspondente à revisão atual.

Depois da revisão do agente e do seu OK para a prévia atual:

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao aprovar "/caminho/da/minha-edicao" --por "Seu nome"
~/projetos/cinema-9d-edicao/bin/cinema-edicao final "/caminho/da/minha-edicao"
```

`cenas.json` deve estar com `status: "reviewed"` para registrar aprovação. Qualquer alteração nos materiais usados, na marca, nas legendas, nos cortes ou nas cenas invalida a aprovação. O registro é controle local de revisão, sem autenticação de usuário.

## O que a base entrega

- Transcrição local em português com Whisper.cpp small multilíngue e tempos de palavras.
- Proposta de remoção de pausas com margens, cortes editáveis e mapeamento para o original.
- Quadros da gravação e tabela de cenas para o agente analisar e revisar.
- Telas de título, lista, métrica, comparação, citação, imagem e barras; composições de cards, telas, textos e conexões com perspectiva/keyframes.
- Rosto em card ou tela cheia; foco, viewport e escala por cena; ocultação da imagem mantendo voz; legendas com supressão por cena/trecho.
- Três efeitos sonoros sintetizados localmente; uso opcional por cena, e trilha opcional fornecida pelo cliente.
- Prévia 540×960, stills e final 1080×1920, em 30 ou 60 fps.
- Áudio normalizado com alvo de −16 LUFS e checagem de duração, áudio e dimensões.
- Arquivos versionados por revisão, exportações com data e relatório técnico por MP4.

Reconhecimento pode errar nomes e números. Os cortes automáticos detectam silêncio; repetições, erros de fala, ritmo e sentido são revisados pelo agente e pela pessoa. O foco pode variar por cena, mas não é detectado automaticamente; esta versão não inclui rastreamento facial. Os templates são a base para a direção, não uma promessa de reproduzir qualquer referência automaticamente.

Antes de alterar uma entrega da base, `revisao "/pasta" --nome r02` preserva decisões/transcrição e ativa a próxima revisão; não copia toda a mídia/código. Montagens próprias em `edicao/remotion-*` usam seus scripts e documentos, pois a raiz pode ser histórica.

## Instalação e manutenção

Node.js 20+, FFmpeg/FFprobe e Whisper.cpp precisam estar no PATH. No Mac com Homebrew, se faltarem: `brew install node ffmpeg whisper-cpp`.

```bash
cd ~/projetos/cinema-9d-edicao
npm ci
npm run setup
npm run doctor
```

O setup baixa um modelo Whisper (~466 MiB), prepara o navegador de render e gera os sons locais. Não chama APIs de IA. As dependências de npm estão fixadas em `package-lock.json`. Para mudar o modelo local, ajuste `whisperModel` em `.runtime/machine.json` e revise a qualidade/tempos da transcrição novamente.

Validação do método: `npm run check` e `npm test`. Uma demonstração sem cliente pode ser criada com `bin/cinema-edicao demo "/tmp/minha-demo"` e renderizada com `previa`.

Veja [o método e os formatos](docs/metodo.md), [o briefing](docs/briefing-modelo.md) e [as instruções de instalação](docs/INSTALACAO.md).

## Referências e custos

Base conceitual: [Bolo de Camadas de pcauhi](https://github.com/pcauhi/bolo-de-camadas), cópia MIT preservada em `vendor/skills/bolo-de-camadas` no commit `f8907602475045b9e45825a09645da18a700fd29`. As alterações e os scripts Cinema 9D são separados da referência.

O uso de Codex/Claude segue seu plano ou cobrança de provedor. Este projeto não inclui credenciais, não contrata serviços e não faz chamadas pagas. Remotion tem [licença própria](https://www.remotion.dev/license); confira a elegibilidade da sua empresa antes de uso comercial. Os arquivos de clientes permanecem nas pastas de produção; não publique esses materiais junto com o método.
