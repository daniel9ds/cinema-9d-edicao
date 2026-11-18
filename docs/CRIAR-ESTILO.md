# Criar seu próprio estilo e kit

Um estilo define identidade, tipografia, legendas, composição, ritmo e regras. Um kit reúne materiais reutilizáveis selecionados. Uma produção contém a gravação, a edição e suas entregas. Separe os três para conseguir mudar de tema sem copiar uma linha de tempo antiga.

## 1. Referências e rascunho

Escolha marca, público, objetivo e referências. Descreva o que aproveitar de cada uma: ritmo, respiro, presença de rosto, ícones, proporção das telas e sons. Referência visual não é permissão para copiar uma pessoa, identidade ou dados de outro produto.

```sh
# COMANDO — novo estilo neutro; use uma pasta nova
~/projetos/cinema-9d-edicao/bin/cinema-edicao estilo-criar "/biblioteca/rascunhos/minha-marca" \
  --id minha-marca --nome "Minha marca — editorial" --marca "Minha marca" --primaria "#496cf5"
```

O rascunho começa sem aprovação e com tokens neutros. Para derivar deliberadamente de um perfil existente, acrescente `--base bookcasting`. Não herda a aprovação do BookCasting. Edite `briefing.md` e `style.json` com o agente. A especificação aceita os tokens presentes em `StyleProfileSchema` (`src/styles.ts`). Novos efeitos fora desse vocabulário pedem implementação explícita e validação do método/composição.

Defina cores/fontes; grid ou arcos; pesos e tamanhos; margens; tempo/easing das entradas; limite de perspectiva; cards; frase inteira ou legenda progressiva; posição do logo e regras de rosto. Descreva receitas sem timestamps fixos: “conexão entre três grupos na frase que os apresenta”, por exemplo. Não transporte tracking, máscaras, roupa ou áudio de outro vídeo como se fossem reutilizáveis.

## 2. Estudo visual antes de registrar

```sh
# COMANDO — demonstração técnica com vídeo e som sintéticos
~/projetos/cinema-9d-edicao/bin/cinema-edicao demo-estilo "/estudos/minha-marca-01" \
  --perfil "/biblioteca/rascunhos/minha-marca/style.json"
~/projetos/cinema-9d-edicao/bin/cinema-edicao previa "/estudos/minha-marca-01"
```

Assista ao MP4, confira legibilidade e revise o estilo. Se mudar o rascunho, use nova revisão no estudo antes de aplicar o perfil atualizado e renderizar:

```sh
# COMANDO — preservar a prévia do estudo anterior
~/projetos/cinema-9d-edicao/bin/cinema-edicao revisao "/estudos/minha-marca-01" --nome r02
~/projetos/cinema-9d-edicao/bin/cinema-edicao estilo "/estudos/minha-marca-01" \
  --perfil "/biblioteca/rascunhos/minha-marca/style.json"
~/projetos/cinema-9d-edicao/bin/cinema-edicao previa "/estudos/minha-marca-01"
```

Forneça sua fonte no estudo para verificar a tipografia exata. O modelo de demonstração é técnico e mantém exemplos ilustrativos; substitua-os por exemplos coerentes com suas receitas. Um estudo sintético não valida cortes de fala real. Faça uma produção piloto real antes de gerar muitas versões. Rascunhos permitem prévias, mas bloqueiam exportação final.

```sh
# COMANDO — após aprovar o estudo atual
~/projetos/cinema-9d-edicao/bin/cinema-edicao estilo-registrar "/biblioteca/rascunhos/minha-marca" \
  --estudo "/estudos/minha-marca-01" --por "Seu nome"
~/projetos/cinema-9d-edicao/bin/cinema-edicao estilos
```

O registro verifica perfil, fingerprint e hash do MP4 do estudo, salva evidência e torna a versão imutável no catálogo local. `reviewed-style` significa aprovação do estilo pelo operador; não aprova futuras edições. Não registra identidade humana autenticada. A versão começa em 1.0.0; para evoluir, crie outra pasta/versão (`--versao 1.1.0`), revise e registre de novo. Não sobrescreva arquivos de catálogo para “ensinar”. Novas produções escolhem explicitamente a versão; snapshots antigos permanecem fixos.

## 3. Kit de materiais da marca

Prepare uma produção-base com estilo consolidado aplicado. Faça um manifesto JSON explícito. Os caminhos source são relativos à produção-base e target são os caminhos a criar no kit e nas futuras produções. Cada arquivo é copiado e fixado por SHA256. A identidade precisa corresponder ao perfil.

```json
{
  "version": 1,
  "id": "minha-marca",
  "description": "Materiais reutilizáveis da minha marca",
  "brand": {
    "name": "Minha marca",
    "primary": "#496cf5", "background": "#101419",
    "foreground": "#f5f6f1", "muted": "#aab1ba", "fontFamily": "Arial",
    "logo": "marca/logo.svg"
  },
  "assets": [{"source": "marca/logo.svg", "target": "marca/logo.svg"}],
  "notes": ["Use somente materiais reais e adapte as telas à nova mensagem."]
}
```

```sh
# COMANDO — selecione somente o que pode ser reutilizado
~/projetos/cinema-9d-edicao/bin/cinema-edicao kit-registrar "/produção-base" \
  --manifesto "/biblioteca/minha-lista.json"

# COMANDO — nova gravação no padrão escolhido
~/projetos/cinema-9d-edicao/bin/cinema-edicao iniciar "/produção-nova" \
  --video "/gravações/nova-fala.mp4" --kit minha-marca
~/projetos/cinema-9d-edicao/bin/cinema-edicao produzir "/produção-nova" --versoes 3 --cpu
```

Inclua fontes locais autorizadas em `brand.fontFile` e `assets`, e telas em `interface/`. Mantenha logos, fontes e telas no kit; não inclua takes, voz, documentos ou retratos privados sem necessidade e autorização. O comando copia apenas a lista explícita, mas o operador continua responsável por escolher o conteúdo. Não inspeciona privacidade, licença ou pessoas dentro dos pixels.

Os destinos aceitos são `marca/`, `interface/` e `elementos/`. O kit não sobrescreve uma identidade conflitante. Um ID já registrado não é sobrescrito: use outro identificador para evoluir o kit. A biblioteca fica fora do método e não é publicada. Para outra máquina/usuário, transfira apenas a pasta de estilo e os materiais que puder compartilhar, preserve a estrutura `styles/<id>/<versão>` e `kits/<id>`, e verifique dependências/licenças. Não use o mesmo id/versão de um estilo central para criar uma sombra local.

## 4. Consolidar o que deu certo

Registre os problemas e soluções em `aprendizados/` com evidência do trecho. Separe regra de marca de ajuste específico de uma cena. Após revisão, incorpore a regra em uma nova versão do estilo ou em notes do novo kit. O agente usa o perfil e o kit explicitamente selecionados; não absorve automaticamente anotações brutas ou todas as conversas anteriores.

Leia [orquestração](ORQUESTRACAO.md) para versões, revisão, aprovação e retomada. Nenhum estudo, registro de estilo ou aprovação antiga autoriza automaticamente uma exportação de cliente ou geração paga.
