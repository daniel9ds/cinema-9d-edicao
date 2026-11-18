# Segurança

## Relatar um problema

Não publique segredos, caminhos privados nem detalhes exploráveis numa issue aberta.

Para relatar uma vulnerabilidade, abra uma [issue](https://github.com/daniel9ds/cinema-9d-edicao/issues) com o título "Contato de segurança", sem detalhes técnicos, pedindo um canal privado. Os detalhes serão combinados por esse canal.

## Escopo

O método roda localmente. Ele lê e grava arquivos nas pastas de produção indicadas, executa FFmpeg, Whisper.cpp e o renderizador do Remotion, e abre um Studio local. Durante o `setup`, baixa o modelo Whisper do Hugging Face (com verificação de SHA-256) e um navegador headless pelo Remotion. Não envia mídia para serviços externos e não usa credenciais.

Cuidados para quem usa:

- Não coloque tokens, senhas ou chaves em `job.json`, briefings, perfis ou kits.
- A pasta `.runtime/` contém caminhos e configurações da sua máquina e não deve ser compartilhada.
- Pastas de produção e a biblioteca local podem conter material confidencial de clientes. Mantenha-as fora de repositórios públicos.
- Registros de aprovação são controles locais de revisão e não autenticam pessoas.
