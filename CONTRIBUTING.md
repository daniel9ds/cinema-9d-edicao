# Como contribuir

Obrigado pelo interesse. O Cinema 9D Edição é um método local: scripts, skill do agente, perfis de estilo e documentação. Contribuições úteis melhoram o método para várias produções, não só para um vídeo.

## Antes de abrir uma issue

- Rode `npm run doctor` e inclua a saída, o sistema operacional, o comando usado e a mensagem de erro.
- Reproduza com a demonstração sintética, se possível: `bin/cinema-edicao demo "/tmp/teste"` e depois `bin/cinema-edicao previa "/tmp/teste"`.
- **Não anexe** gravações, logos, fontes, telas, transcrições ou dados de clientes ou de outras pessoas. Se o problema depender de um arquivo, descreva o formato (codec, duração, resolução) em vez de enviá-lo.

## Pull requests

1. Faça mudanças pequenas e com um objetivo claro.
2. Rode `npm run check` e `npm test`. Para mudanças de render, valide com um trabalho sintético em pasta temporária: `npm run validar:base` e, se tocar na orquestração, `npm run validar:orquestracao`. Essas rotinas não usam APIs pagas.
3. Preserve a compatibilidade dos campos antigos de `job.json`, `cortes.json`, `cenas.json` e dos perfis de estilo.
4. Não altere templates compartilhados para resolver o caso de um único cliente sem considerar as outras produções.
5. Registre mudanças e limitações em `docs/aprendizados-incorporados.md`.
6. Não inclua credenciais, arquivos de `.runtime/`, pastas de produção nem materiais de marca sem autorização para redistribuição.
7. As ilustrações do README são geradas por `node docs/assets/readme/gerar.mjs`. Edite o gerador, não os SVGs.

Ao enviar uma contribuição, você concorda que ela seja distribuída sob a [licença MIT](LICENSE) do projeto.

## O que o método não deve fazer sozinho

- Aprovar edições em nome de alguém.
- Chamar serviços pagos, fazer upload de mídia ou publicar automaticamente.
- Transformar uma referência de outra marca em cópia de seus assets, textos ou tempos.

Essas regras estão em [AGENTS.md](AGENTS.md) e na [skill](skills/cinema-9d-edicao/SKILL.md).
