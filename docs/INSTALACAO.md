# Instalação do Cinema 9D Edição

## Pré-requisitos

- Node.js 20 ou superior e npm.
- FFmpeg/FFprobe e Whisper.cpp (`whisper-cli`) disponíveis no PATH.
- Git e acesso ao repositório GitHub.
- Espaço para dependências, navegador, modelo Whisper e cache de render.

No macOS com Homebrew: `brew install node ffmpeg whisper-cpp`.
O setup usa `which` e comandos de sistema Unix. Windows nativo não foi validado.

## Instalar

```bash
mkdir -p ~/projetos
git clone https://github.com/daniel9ds/cinema-9d-edicao.git ~/projetos/cinema-9d-edicao
cd ~/projetos/cinema-9d-edicao
npm ci
npm run setup
npm run instalar:skill
npm run doctor
```

O destino pode ser outro: o executável resolve sua raiz. Ajuste os caminhos dos exemplos para a sua instalação. Repositórios privados exigem sua credencial normal de GitHub; não copie credenciais para o método ou para produções.

`setup` baixa o modelo Whisper small multilíngue (~466 MiB), prepara um navegador compatível do Remotion e gera três sons sintéticos. Esses downloads não são chamadas de geração paga. Configurações específicas da máquina ficam em `.runtime/`, ignorada pelo Git. Não copie `.runtime/machine.json` de outra máquina: execute setup nela.

`instalar:skill` vincula a skill desta instalação em `~/.codex/skills/cinema-9d-edicao` e `~/.claude/skills/cinema-9d-edicao`. Não substitui outro arquivo/vínculo existente. Se outro clone já estiver vinculado, escolha a instalação que deseja manter e ajuste o vínculo manualmente. Reabra o agente depois da instalação.

O método não contém credenciais ou mídia de clientes e não chama APIs pagas. As dependências estão fixadas no lockfile; cada produção deve ficar em uma pasta independente. Veja [novos projetos](novos-projetos.md).

## Evidências e limitações

`validacao-local.json` e `examples/demonstracao-tecnica.mp4` são evidências históricas da versão 0.1.0, com mídia sintética; não certificam os novos componentes da 0.2.0.

A atualização 0.2.0 passou por checagem estática TypeScript e conferência de frontmatter. Testes e render de demonstração da atualização não foram executados. A avaliação visual, de sincronização e de áudio deve ocorrer na prévia da produção. Veja [melhorias incorporadas](aprendizados-incorporados.md).

Para uma verificação solicitada do método, estão disponíveis `npm run check`, `npm test` e o comando `demo` seguido de `previa`, usando uma pasta temporária e mídia sintética. Não confunda uma checagem técnica com aprovação criativa.
