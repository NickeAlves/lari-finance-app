# Security Policy

## Versão suportada

Este projeto não segue versionamento semântico público. Apenas a versão em produção (branch `main`) recebe atualizações de segurança.

## Reportando vulnerabilidades

Envie um e-mail para **nickalves88@gmail.com** com o assunto `[SECURITY] Lari Finance`.

Inclua no reporte:
- Descrição clara da vulnerabilidade
- Passos para reproduzir (proof of concept, se possível)
- Impacto potencial e superfície de ataque

Você pode esperar uma resposta em até **5 dias úteis**. Vulnerabilidades confirmadas serão corrigidas com prioridade; você será notificado quando o fix estiver em produção.

Não abra issues públicas para reportar falhas de segurança.

## Considerações de segurança

### Autenticação e tokens
- O token de autenticação é armazenado em `localStorage` (`lari-finance-auth-v1`). Isso o torna suscetível a ataques XSS. Certifique-se de que não há injeção de scripts de terceiros na aplicação.
- O interceptor HTTP (`auth.interceptor.ts`) adiciona o header `Authorization: Bearer <token>` em todas as requisições de saída.

### Variáveis de ambiente
- `API_BASE_URL` e as variáveis `LARI_*` são embutidas em `public/env.js` em runtime e ficam visíveis no cliente. Não coloque segredos nessas variáveis.
- Segredos reais (chaves de API do backend, credenciais de banco de dados) devem existir apenas no servidor e nunca ser expostos via `API_BASE_URL` ou similares.

### HTTPS em produção
- O Caddy provisiona TLS automaticamente em produção. Nunca exponha a aplicação via HTTP puro em ambiente de produção.
- No Railway, o HTTPS é gerenciado pela plataforma.

### Dados em localStorage
- Lançamentos pendentes de sincronização são cacheados em `localStorage` (`lari-finance-payments-v1`). Dados financeiros sensíveis ficam acessíveis a qualquer script rodando na mesma origem.
