# Licença, créditos e componentes de terceiros

## Código deste projeto

O código e a documentação originais do Cinema 9D Edição estão sob a [licença MIT](LICENSE), © 2026 Daniel da Costa Gomes Martins / 9D Studio.

A licença MIT do projeto **não substitui** as condições dos componentes abaixo e **não concede direitos** sobre marcas, logotipos ou materiais de clientes:

- Os nomes e símbolos 9D, 9D Studio e Cinema 9D, inclusive `docs/assets/readme/logo-9d.svg` e o símbolo usado nas ilustrações do README, identificam o projeto e não estão licenciados para uso como marca.
- Perfis de estilo de exemplo, como `styles/bookcasting/`, contêm tokens (cores, tamanhos, regras) e o nome da marca que os originou. O perfil não inclui logo, fonte, mídia ou telas dessa marca, e o nome não é licenciado para uso.
- Gravações, logos, fontes, telas, vozes e imagens usados em cada produção pertencem a seus titulares e continuam sujeitos às permissões de uso deles.

## Componentes de terceiros

- **Bolo de Camadas**, de Cauhi (pcauhi): https://github.com/pcauhi/bolo-de-camadas, commit `f8907602475045b9e45825a09645da18a700fd29`, licença MIT. A cópia integral da skill e da licença está em `vendor/skills/bolo-de-camadas`. É a referência de direção em cinco camadas; os scripts deste projeto são uma implementação adicional e separada.
- **Remotion**: https://www.remotion.dev/license. Tem licença própria, que não é MIT. Ela é gratuita em alguns casos, e empresas podem precisar de uma licença paga. Confira a elegibilidade antes do uso comercial. O framework é instalado pelo npm e não é redistribuído como código deste projeto.
- **Whisper.cpp / ggml**: https://github.com/ggml-org/whisper.cpp, licença MIT. O modelo `ggml-small.bin` é baixado do repositório ggerganov/whisper.cpp no Hugging Face durante o `setup`. Ele deriva do OpenAI Whisper (MIT) e não é redistribuído neste repositório.
- **FFmpeg**: https://ffmpeg.org/legal.html. Usa-se a instalação do sistema; os codecs e a licença dependem da compilação instalada.
- **React, Zod e demais pacotes npm**: cada um mantém sua licença no respectivo pacote em `node_modules`. As versões estão fixadas em `package-lock.json`.

Os sons click, whoosh e impact são sintetizados localmente pelo `setup`, com FFmpeg, sem amostras de bibliotecas comerciais.
