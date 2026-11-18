# Perfis de estilo

Um perfil de estilo guarda, com versão, a linguagem visual de uma marca: identidade, tipografia, movimento, composição e regras de uso. Ele não guarda arquivos nem a linha de tempo de nenhuma produção.

O catálogo do método traz um perfil de exemplo neutro: [exemplo 1.0.0](../styles/exemplo/1.0.0/README.md). Perfis da sua marca ficam na sua biblioteca local (por padrão `~/projetos/cinema-9d-biblioteca/styles/`), fora do repositório. Veja [criar estilo](CRIAR-ESTILO.md).

## Camadas

1. **Método:** scripts, esquema de dados e componentes reutilizáveis.
2. **Perfil de estilo:** identidade, tipografia, movimento, composição e regras de uso, versionados.
3. **Produção:** fala, vídeo, marca fornecida, telas, gestos, decisões e aprovação específica.

Não copie uma produção inteira para iniciar outro tema. Use `iniciar` com o perfil e forneça os novos materiais. Para outra marca, o perfil pode precisar mudar em vários aspectos além da cor.

## Comandos

```bash
bin/cinema-edicao estilos
bin/cinema-edicao iniciar "/caminho/producao" --estilo exemplo --versao 1.0.0
bin/cinema-edicao estilo "/caminho/producao" --usar exemplo --versao 1.0.0
bin/cinema-edicao demo-estilo "/tmp/estudo-novo" --estilo exemplo
```

`estilos` lista os perfis do catálogo do método e da biblioteca local. Em qualquer pasta, use o caminho completo do executável da instalação. `estilo` requer uma produção da base, não uma composição própria em `edicao/remotion-*`.

O comando recusa aplicar um perfil sobre uma produção cuja identidade tenha outro nome de marca. O perfil `exemplo` usa o nome provisório "Sua marca", que é o padrão de uma produção nova.

O snapshot de `marca/estilo.json` precisa corresponder ao `job.style` e à identidade. Uma versão nova é aplicada explicitamente e exige revisão e novo MP4. Mantenha versões registradas sem alteração: crie uma nova pasta de versão quando houver mudança aprovada.

## Escopo

O perfil descreve e aplica tokens; a narrativa e a seleção de receitas continuam sendo trabalho de direção. Perfis próprios ficam na biblioteca local, e a orquestração monta N versões com direção do agente ativo. Consulte [orquestração](ORQUESTRACAO.md) e [criar estilo](CRIAR-ESTILO.md). Nenhum script tem compreensão semântica embutida.

Aprendizados entram primeiro na produção, com evidência. Só os que podem ser reutilizados devem virar alterações do método ou do perfil.

## Validação

`npm run check` e `npm test` cobrem contratos e funções. `npm run validar:base` cria fixtures, verifica hashes e caminhos, renderiza em 540×960 e 1080×1920 e confere legendas, aprovação sintética, transcrição local no macOS e sincronização do Studio. Ela abre um servidor local temporário e precisa de permissões para ele e para o cache do Remotion.

O relatório gerado é técnico. Registre separadamente a inspeção visual dos PNGs e MP4 e a aprovação estética do perfil. Fixtures não demonstram remoção de fundo, precisão de gestos humanos, identidade ou lipsync de clipes de IA.
