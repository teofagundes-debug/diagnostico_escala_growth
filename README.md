# Diagnóstico Escala Growth — MVP

MVP responsivo para coletar informações, pontuar 25 respostas em cinco pilares, diagnosticar a maturidade comercial e gerar relatório em PDF.

## Uso

Requer Node.js 22. Execute `pnpm install` e `pnpm dev`. Para produção, `pnpm build`.

O progresso é salvo no navegador. No resultado, clique **Baixar relatório em PDF** e escolha **Salvar como PDF** na impressão.

## Cálculo

Cada pilar contém cinco perguntas de 0 a 4 (máximo 20). O total máximo é 100. Os três menores percentuais viram prioridades.

## Supabase

O MVP funciona localmente, sem integração externa. Para a próxima fase, execute `database/schema.sql` no SQL Editor do Supabase e configure as variáveis de `.env.example`. A chave de serviço deve existir somente no servidor.

## Deploy

O projeto está preparado para build e publicação. Configure o comando de build `pnpm build` e o ambiente Node.js 22+ no provedor.

