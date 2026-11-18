# Perfis de estilo — primeira consolidação

O primeiro perfil é [BookCasting 1.0.0](../styles/bookcasting/1.0.0/README.md). Ele separa a linguagem visual dos arquivos e da linha de tempo da produção que serviu de referência.

## Camadas

1. **Método:** scripts, esquema de dados e componentes reutilizáveis.
2. **Perfil de estilo:** identidade, tipografia, movimento, composição e regras de uso, versionados.
3. **Produção:** fala, vídeo, marca fornecida, telas, gestos, decisões e aprovação específica.

Não copie uma produção inteira para iniciar outro tema. Use `iniciar` com o perfil e forneça os novos materiais. Para outra marca, o perfil pode precisar mudar em vários aspectos além da cor.

## Comandos atuais

```bash
bin/cinema-edicao estilos
bin/cinema-edicao iniciar "/caminho/producao" --estilo bookcasting --versao 1.0.0
bin/cinema-edicao estilo "/caminho/producao" --usar bookcasting --versao 1.0.0
bin/cinema-edicao demo-estilo "/tmp/estudo-novo" --estilo bookcasting
```

Em qualquer pasta, use o caminho completo do executável da instalação. `estilo` requer uma produção da base, não uma composição própria histórica. Não aplique o perfil sobre a R10 original.

O snapshot de `marca/estilo.json` precisa corresponder ao `job.style` e à identidade. Uma versão nova é aplicada explicitamente e exige revisão/novo MP4. Mantenha versões publicadas sem alteração: crie uma nova pasta de versão quando houver mudança aprovada.

## Escopo desta etapa

O catálogo central traz BookCasting como exemplo. Na versão 0.4.0, perfis próprios ficam na biblioteca local e a orquestração monta N versões com direção do agente ativo. Consulte ORQUESTRACAO.md e CRIAR-ESTILO.md. Não anunciar produção sem revisão ou compreensão semântica embutida no script.

O perfil descreve e aplica tokens; a narrativa e a seleção de receitas continuam sendo trabalho de direção. Aprendizados entram primeiro na produção, com evidência. Só os que podem ser reutilizados devem virar alterações do método/perfil.

## Validação

`npm run check` e `npm test` cobrem contratos e funções. `npm run validar:base` cria fixtures, verifica hashes/caminhos, renders 540×960 e 1080×1920, legendas, aprovação sintética, transcrição local no macOS e sincronização do Studio. Abre um servidor local temporário e necessita permissões para ele e para o cache do Remotion.

O relatório gerado é técnico. Registre separadamente a inspeção visual dos PNGs/MP4 e a aprovação estética do perfil. Fixtures não demonstram remoção de fundo, precisão de gestos humanos, identidade ou lipsync de clipes de IA. O estudo usa assets ilustrativos, sem transferir mídia privada da produção de referência.

## Evolução 0.4.0

Novos estilos podem ser criados como rascunhos e registrados na biblioteca local após estudo verificado. Leia [criar estilo](CRIAR-ESTILO.md). Um kit separado leva logo, fonte e telas selecionadas à próxima gravação. Para N alternativas com direção do agente ativo, veja [orquestração](ORQUESTRACAO.md). Não altere um snapshot de produção ou o catálogo para reaproveitar uma aprovação.
