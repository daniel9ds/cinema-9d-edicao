<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/banner-escuro.svg" />
    <img src="docs/assets/readme/banner-claro.svg" alt="Cinema 9D Edição: sua gravação de fala vira vídeo vertical editado, com seu agente de IA e ferramentas locais. Cortes, legendas e motion." width="960" />
  </picture>
</p>

<p align="center">
  <a href="#03--instalação"><strong>INSTALAR</strong></a>
  &nbsp;·&nbsp;
  <a href="#04--começar-com-codex-ou-claude-code">COMEÇAR UM TRABALHO</a>
  &nbsp;·&nbsp;
  <a href="#05--edição-revisão-e-exportação">COMANDOS</a>
  &nbsp;·&nbsp;
  <a href="#07--custos-dependências-e-limites">LIMITES</a>
  &nbsp;·&nbsp;
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  <strong>Codex + Claude Code</strong> · Whisper local · Remotion · FFmpeg · versão 0.4.0
</p>

---

## 00 / O que é

O **Cinema 9D Edição** é um método para editar vídeos verticais de fala com um agente de IA no terminal (Codex ou Claude Code). Você grava, entrega os materiais e diz o objetivo. O agente lê a transcrição, decide os cortes e as cenas e monta a edição com scripts locais. Você assiste à prévia e aprova.

Serve para quem grava vídeos curtos falando para a câmera: criadores, professores, profissionais liberais, pequenas marcas, agências e editores que querem um processo repetível e rastreável, com legendas sincronizadas, telas, cards e identidade visual, sem enviar a gravação para serviços de terceiros.

O repositório guarda **o método**: código, skill do agente, perfis de estilo e documentação. Cada vídeo fica numa **pasta de produção** sua, fora do método.

O que o método **não** é: um editor automático. Os scripts transcrevem, propõem cortes por silêncio, validam e renderizam; não entendem a fala nem fazem direção criativa sozinhos. Quem decide é o agente que você está usando, e quem aprova é você.

## 01 / Como funciona

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/fluxo-escuro.svg" />
    <img src="docs/assets/readme/fluxo-claro.svg" alt="Fluxo de produção em sete etapas: 1 materiais e briefing (pessoa); 2 transcrição e proposta de cortes (automático, comando preparar); 3 direção e montagem (agente e automático, comando planejar); 4 prévia (automático, comando previa); 5 revisão humana (pessoa); 6 aprovação da revisão atual (pessoa, comando aprovar); 7 exportação final (automático, comando final). Uma seta tracejada leva os ajustes da revisão humana de volta à direção e montagem. Qualquer mudança em corte, cena, legenda, marca ou mídia invalida a aprovação anterior e exige nova prévia e nova aprovação." width="720" loading="lazy" />
  </picture>
</p>

| Quem | O que faz |
|---|---|
| **Automático** (scripts locais) | Transcreve com Whisper, extrai quadros, propõe cortes por silêncio, remapeia legendas, valida arquivos, renderiza prévias e finais, confere duração, áudio e resolução. |
| **Agente** (Codex ou Claude Code) | Lê a fala palavra por palavra, revisa os cortes, escreve `cortes.json` e `cenas.json`, escolhe telas e movimentos, roda os comandos e inspeciona a prévia. |
| **Pessoa** (você) | Fornece gravação, marca e briefing; assiste à prévia; pede ajustes; aprova a revisão atual. |

A aprovação é registrada com `aprovar --por "Nome"` e fica ligada ao hash do MP4 da prévia e dos dados da edição. Se algo mudar depois, o `final` recusa exportar até haver nova prévia e nova aprovação. O registro é um controle local de revisão e não autentica a identidade de ninguém.

## 02 / Um método, várias produções

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/readme/estrutura-escuro.svg" />
    <img src="docs/assets/readme/estrutura-claro.svg" alt="Estrutura: no topo, a instalação central do método em ~/projetos/cinema-9d-edicao, com bin/cinema-edicao, scripts, src com Remotion, skills, styles e docs, e a skill vinculada em ~/.claude e ~/.codex. Ao lado, a biblioteca local opcional em ~/projetos/cinema-9d-biblioteca, com estilos e kits, fora do Git. O método opera cada produção pelo caminho absoluto. A produção A, em qualquer pasta, tem entrada (gravação original, só leitura), roteiro, marca e interface, edicao, trabalho, versoes e saida. As produções B e C têm a mesma estrutura e arquivos próprios." width="720" loading="lazy" />
  </picture>
</p>

- **Instalação central:** este repositório, clonado uma vez. O executável `bin/cinema-edicao` funciona a partir de qualquer pasta do terminal e recebe o caminho absoluto da produção.
- **Produção:** uma pasta por vídeo, em qualquer lugar do computador. A gravação original em `entrada/` não é alterada. Marca, telas, briefing, edição e exportações ficam nela.
- **Biblioteca local (opcional):** estilos e kits de marca próprios, por padrão em `~/projetos/cinema-9d-biblioteca`. Não faz parte do repositório.

```text
minha-producao/
├── job.json                 configuração do trabalho
├── entrada/                 gravação original (somente leitura)
├── roteiro/briefing.md      objetivo, público e preferências
├── marca/identidade.json    cores, fonte e logo
├── interface/               telas do produto
├── elementos/               imagens e sons autorizados
├── referencias/             vídeos e imagens de referência
├── edicao/                  cortes, cenas e aprovação da revisão
├── trabalho/                transcrição, quadros, plano e cache
├── aprendizados/            observações e propostas locais
└── saida/                   prévias e exportações finais
```

## 03 / Instalação

### Requisitos

- Node.js 20 ou superior e npm.
- FFmpeg e FFprobe no PATH.
- Whisper.cpp (`whisper-cli`) no PATH.
- Git.
- Cerca de 4 GB livres para dependências npm, navegador de render e modelo Whisper (medido: ~3,5 GB numa instalação macOS), além do espaço de cada produção.
- Codex ou Claude Code, para a parte de direção.

No macOS com Homebrew:

```bash
brew install node ffmpeg whisper-cpp
```

O método foi validado no macOS (Apple Silicon). O `setup` usa comandos Unix; Linux não foi validado e Windows nativo não é suportado.

### Instalar

```bash
mkdir -p ~/projetos
git clone https://github.com/daniel9ds/cinema-9d-edicao.git ~/projetos/cinema-9d-edicao
cd ~/projetos/cinema-9d-edicao
npm ci
npm run setup
npm run instalar:skill
npm run doctor
```

- `npm run setup` baixa o modelo Whisper small multilíngue (cerca de 466 MiB, do Hugging Face) e confere o SHA-256. Também prepara o navegador de render do Remotion e sintetiza três efeitos sonoros com FFmpeg. As configurações da máquina ficam em `.runtime/`, que não é versionada.
- `npm run instalar:skill` cria vínculos da skill em `~/.claude/skills/cinema-9d-edicao` e `~/.codex/skills/cinema-9d-edicao`. Ele não substitui um vínculo existente que aponte para outra instalação. Reabra o agente depois.
- `npm run doctor` lista o que está disponível.

Você pode clonar em outro caminho; ajuste o prefixo dos comandos. Para atualizar: `git pull --ff-only` e `npm ci`, depois leia [atualização e limites](docs/ATUALIZACAO.md). Detalhes em [instalação](docs/INSTALACAO.md).

## 04 / Começar com Codex ou Claude Code

1. Crie a pasta da produção com a gravação:

   ```bash
   ~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/caminho/minha-producao" --nome "Minha edição" --video "/caminho/gravacao.mov"
   ```

   Sem `--video`, coloque o arquivo em `entrada/video.mp4` depois. Use `--tema "Tema"`, `--estilo bookcasting` (perfil de exemplo) ou `--kit <id>` (kit da sua biblioteca) quando fizer sentido.

2. Coloque logo e fonte em `marca/`, telas em `interface/`, imagens e sons autorizados em `elementos/`, e preencha `roteiro/briefing.md` ([modelo](docs/briefing-modelo.md)).

3. Abra o agente (em qualquer pasta) e peça:

   **Claude Code**

   ```text
   Use a skill cinema-9d-edicao para a produção em /caminho/minha-producao.
   Leia o briefing e os materiais, prepare a transcrição e os cortes, crie o plano de cenas conforme a fala
   e me mostre o plano e a prévia. Não use serviços pagos e não aprove sem o meu OK.
   ```

   **Codex**

   ```text
   Use $cinema-9d-edicao para a produção em /caminho/minha-producao.
   Leia o briefing e os materiais, prepare a transcrição e os cortes, crie o plano de cenas conforme a fala
   e me mostre o plano e a prévia. Não use serviços pagos e não aprove sem o meu OK.
   ```

O agente segue [a skill](skills/cinema-9d-edicao/SKILL.md) e [o método](docs/metodo.md): roda `preparar`, lê a transcrição e os quadros, revisa os cortes, escreve as cenas, gera a prévia e mostra o resultado. Se você abrir o agente na pasta deste repositório, ele também lê [AGENTS.md](AGENTS.md) e [CLAUDE.md](CLAUDE.md).

Para testar sem gravação própria, crie uma demonstração com vídeo e som sintéticos:

```bash
~/projetos/cinema-9d-edicao/bin/cinema-edicao demo "/tmp/minha-demo"
~/projetos/cinema-9d-edicao/bin/cinema-edicao previa "/tmp/minha-demo"
```

## 05 / Edição, revisão e exportação

Use sempre o caminho completo do executável e o caminho absoluto da produção. `bin/cinema-edicao help` lista todos os comandos.

| Etapa | Comando | Resultado |
|---|---|---|
| Preparar | `preparar "/producao"` | Quadros, transcrição local e propostas de `cortes.json` e `cenas.json` |
| Atualizar o plano | `planejar "/producao"` | Legendas remapeadas para a edição e `trabalho/plano-cenas.md` |
| Validar | `validar "/producao"` | Checagem de esquema, caminhos e tempos |
| Prévia | `previa "/producao"` | MP4 540×960 e três quadros (`--quadros` gera só os quadros) |
| Acompanhar | `studio "/producao"` | Remotion Studio local, com sincronização dos dados |
| Nova revisão | `revisao "/producao" --nome r02` | Preserva as decisões atuais antes de mudar uma prévia entregue |
| Aprovar | `aprovar "/producao" --por "Nome"` | Registro ligado à prévia atual; só depois do seu OK |
| Exportar | `final "/producao"` | MP4 1080×1920 com relatório técnico em `saida/` |
| Estado | `status "/producao"` | Situação da revisão, da prévia e da aprovação |

Para aprovar, `edicao/cenas.json` precisa estar com `status: "reviewed"`. Os tempos de `cortes.json` são da gravação original; os de `cenas.json` são da edição. Formatos e campos estão em [método e arquivos](docs/metodo.md).

## 06 / Várias versões, estilos e kits

- **Várias versões:** `produzir "/producao" --versoes 3 --cpu` cria um lote com pastas isoladas por versão. O agente escreve o plano com diferenças editoriais reais, o orquestrador monta e renderiza, e o agente registra a revisão criativa. Depois a galeria local fica em `saida/lotes/<lote>/index.html`. Só com o seu OK: `aprovar-lote --por "Nome"` e `finalizar-lote`. Veja [orquestração](docs/ORQUESTRACAO.md).
- **Estilos:** perfis versionados de cores, tipografia, legendas e composição. Cada produção recebe uma cópia fixada por hash. O catálogo traz o perfil de exemplo `bookcasting` 1.0.0. Veja [estilos](docs/ESTILOS.md).
- **Estilo e kit próprios:** `estilo-criar` → `demo-estilo` → `previa` → `estilo-registrar`. O `kit-registrar` copia para a biblioteca apenas uma lista explícita de materiais, com SHA-256. Veja [criar estilo e kit](docs/CRIAR-ESTILO.md).
- **Aprendizados:** `aprender` registra observações locais numa produção. Elas não alteram o método nem treinam modelos. Veja [novos projetos](docs/novos-projetos.md).

## 07 / Custos, dependências e limites

**Custos.** O método não inclui credenciais, não contrata serviços e não faz chamadas pagas. Whisper, FFmpeg e Remotion rodam na sua máquina. O que pode custar:

- O agente (Codex ou Claude Code) segue o plano ou a cobrança do seu provedor.
- O Remotion tem [licença própria](https://www.remotion.dev/license): empresas podem precisar de licença paga para uso comercial.
- Imagem, vídeo ou voz gerados por IA (por exemplo, Higgsfield) são opcionais, ficam fora do método e só entram com pedido e autorização explícitos.

**Dependências.** As versões npm estão fixadas em `package-lock.json` (Remotion 4.0.535, React 19, Zod 4, TypeScript 5.9). O setup baixa o modelo Whisper e um navegador headless compatível com o Remotion.

**Limites reais desta versão:**

- A transcrição pode errar nomes, números e termos; a revisão é do agente e sua.
- Os cortes automáticos detectam silêncio. Repetições, erros de fala e ritmo dependem da revisão.
- O enquadramento é um foco fixo configurável por cena. Não há rastreamento facial, remoção de fundo, máscara automática, troca de roupa nem 3D.
- A checagem técnica confere estrutura, duração, áudio e resolução. Ela não comprova qualidade criativa, leitura ou exatidão da fala.
- A renderização é sequencial e local. Não há fila remota, publicação automática nem sincronização entre máquinas.
- Validado apenas no macOS (Apple Silicon).

Evidências técnicas da versão atual: [validação 0.4.0](docs/VALIDACAO-0.4.0.md).

## 08 / Documentação

| Documento | Conteúdo |
|---|---|
| [docs/metodo.md](docs/metodo.md) | Operação, formatos de `job.json`, identidade, cortes e cenas |
| [docs/INSTALACAO.md](docs/INSTALACAO.md) | Requisitos, setup, skill e evidências |
| [docs/novos-projetos.md](docs/novos-projetos.md) | Novos temas, montagens próprias e aprendizados |
| [docs/ORQUESTRACAO.md](docs/ORQUESTRACAO.md) | Lotes com N versões, retomada, galeria e aprovação |
| [docs/ESTILOS.md](docs/ESTILOS.md) | Perfis de estilo e snapshots |
| [docs/CRIAR-ESTILO.md](docs/CRIAR-ESTILO.md) | Criar estilo e kit próprios |
| [docs/ATUALIZACAO.md](docs/ATUALIZACAO.md) | Atualizar a instalação com segurança |
| [docs/aprendizados-incorporados.md](docs/aprendizados-incorporados.md) | O que cada versão incorporou e seus limites |
| [skills/cinema-9d-edicao/SKILL.md](skills/cinema-9d-edicao/SKILL.md) | Instruções que o agente segue |

## 09 / Contribuir e relatar problemas

- **Problemas e sugestões:** abra uma [issue](https://github.com/daniel9ds/cinema-9d-edicao/issues). Informe o sistema, a saída de `npm run doctor`, o comando usado e o erro. **Não anexe** gravações, logos, telas ou dados de clientes; use a demonstração sintética (`demo`) para reproduzir.
- **Contribuições:** leia [CONTRIBUTING.md](CONTRIBUTING.md). Antes de abrir um pull request, rode `npm run check` e `npm test`.
- **Segurança:** veja [SECURITY.md](SECURITY.md). Não publique segredos nem detalhes de vulnerabilidade numa issue aberta.

## 10 / Licença e créditos

O código e a documentação originais estão sob a [licença MIT](LICENSE), © 2026 Daniel da Costa Gomes Martins / 9D Studio.

A licença do projeto não substitui as condições do Remotion nem de outros componentes de terceiros, e não concede direitos sobre as marcas 9D e Cinema 9D, sobre marcas citadas em perfis de exemplo nem sobre materiais de clientes. Detalhes em [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Base conceitual: [Bolo de Camadas](https://github.com/pcauhi/bolo-de-camadas), de Cauhi (MIT). A cópia integral está preservada em `vendor/skills/bolo-de-camadas`. O método amplia a proposta de cinco camadas com proposta de cortes, mapeamento de tempos, revisão e aprovação.
