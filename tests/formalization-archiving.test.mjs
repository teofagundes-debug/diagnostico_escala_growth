import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');

test('migration V73 é aditiva e não remove documentos históricos',()=>{
 const sql=read('database/migration_v73_arquivamento_formalizacoes.sql');
 assert.match(sql,/formalizacoes add column if not exists arquivada_em/);
 assert.match(sql,/empresas add column if not exists arquivada_em/);
 assert.match(sql,/status<>'ARQUIVADA'/);
 assert.doesNotMatch(sql,/\bdelete\s+from\b/i);
 assert.doesNotMatch(sql,/\bupdate\s+public\.(proposta_publicacoes|financeiro_growth|contratos_growth|aceites_growth|pagamentos_growth)\b/i);
});

test('exclusão arquiva formalizações, desativa Portal e preserva filhos',()=>{
 const api=read('app/api/companies/route.ts'),sql=read('database/migration_v73_arquivamento_formalizacoes.sql'),start=api.indexOf('export async function DELETE');
 const branch=api.slice(start);
 assert.match(branch,/rpc\/arquivar_empresa_com_historico/);
 assert.match(sql,/status='ARQUIVADA'/);
 assert.match(sql,/motivo_arquivamento='EMPRESA_EXCLUIDA'/);
 assert.match(sql,/update public\.portal_usuarios set ativo=false/);
 assert.doesNotMatch(branch,/method:'DELETE'/);
 for(const table of ['proposta_publicacoes','financeiro_growth','contratos_growth','aceites_growth','pagamentos_growth'])assert.doesNotMatch(branch,new RegExp(`removeRows\\('${table}'`));
});

test('empresa arquivada sai da operação e não autentica no Portal',()=>{
 const companies=read('app/api/companies/route.ts'),diagnostics=read('app/api/diagnostics/route.ts'),access=read('lib/access.ts'),portal=read('app/api/portal/route.ts');
 assert.match(companies,/empresas\?arquivada_em=is\.null/);
 assert.match(diagnostics,/empresas\.arquivada_em=is\.null/);
 assert.match(access,/arquivada_em=is\.null/);
 assert.match(portal,/Este acesso não está mais disponível/);
});

test('arquivo administrativo é master-only e mantém legado ambíguo separado',()=>{
 const api=read('app/api/companies/route.ts'),screen=read('components/ArchivedFormalizations.tsx');
 assert.match(api,/current\.role!=='master'/);
 assert.match(api,/legado_sem_formalizacao/);
 assert.match(screen,/somente leitura/);
 assert.match(screen,/Preservado sem associação automática/);
 assert.match(read('components/CentralApp.tsx'),/Formalizações Arquivadas/);
});

test('arquivamento ocorre em uma única transação no banco',()=>{
 const sql=read('database/migration_v73_arquivamento_formalizacoes.sql');
 assert.match(sql,/create or replace function public\.arquivar_empresa_com_historico/);
 assert.match(sql,/for update/);
 assert.match(sql,/insert into public\.exclusoes_empresas_log/);
 assert.match(sql,/grant execute .* to service_role/);
});
