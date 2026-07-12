# Diagnóstico Escala Growth

Aplicação pública e área interna Central Escala Growth.

## URLs
- Aplicação: https://diagnostico-escala-growth-fuoc.onrender.com/
- Login da Central: https://diagnostico-escala-growth-fuoc.onrender.com/login
- Central: https://diagnostico-escala-growth-fuoc.onrender.com/central

## Administrador inicial
Nome: Teófilo Oliveira Fagundes
E-mail: teofagundes@gmail.com
Senha temporária: EscalaGrowth@2026

Após configurar o Supabase, execute pnpm setup:admin. O script não cria conta duplicada. Altere a senha temporária em Supabase > Authentication > Users.

## Configuração
Configure no Render: SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.
Aplique no SQL Editor: database/schema.sql, database/migration_v2.sql e database/migration_v3_central.sql, nessa ordem.
A service_role é exclusiva do servidor.

## Usuários e senhas
Crie novos usuários em Supabase > Authentication > Users > Add user. Para alterar ou redefinir senha, abra o usuário e use Update user ou Reset password. Cada membro deve ter uma conta individual.

## Banco
empresas; responsaveis; diagnosticos; respostas; respostas_abertas; resultados_pilares; diagnostico_status_historico; planos_estrategicos; reunioes_estrategicas; implantacoes; configuracoes. As tabelas administrativas usam RLS.

## Funcionalidades
Diagnóstico e IEG; relatório, radar, prioridades e certificado; agendamento; persistência no Supabase; login Supabase Auth; dashboard executivo; diagnósticos; empresas; reuniões; planos; implantações; evolução; histórico e observações internas.

## Desenvolvimento
Node.js 22. Use pnpm install, pnpm dev, pnpm test, pnpm build e pnpm setup:admin.

## Próximas evoluções
Upload do PDF no Supabase Storage; recuperação de senha na aplicação; perfis por função; integração Cal.com; evolução histórica do IEG; auditoria administrativa.

## Filosofia
O Diagnóstico mostra onde a empresa está. A Reunião Estratégica define para onde ela vai. O Plano Estratégico mostra como chegar. A Implantação executa. O IEG mede a evolução.

