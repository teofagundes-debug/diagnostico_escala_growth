import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('arquitetura possui apenas Master e Cliente',()=>{const sql=read('database/migration_v12_perfis_simplificados.sql');assert.match(sql,/perfil in \('master','cliente'\)/);assert.doesNotMatch(sql,/perfil in \([^)]*consultor/);assert.ok(read('lib/access.ts').includes('Consultor, Financeiro'))});
test('rotas administrativas exigem Master',()=>{for(const file of ['app/api/central/route.ts','app/api/dossiers/route.ts','app/api/commercial/route.ts','app/api/users/route.ts'])assert.match(read(file),/isMaster/)});
test('cadastro exp?e somente os dois tipos desta vers?o',()=>{const ui=read('components/CentralApp.tsx');assert.match(ui,/<option value="master">Master<\/option><option value="cliente">Cliente<\/option>/);const api=read('app/api/users/route.ts');assert.match(api,/body\.perfil==='master'\?'master':'cliente'/)});
test('portal restringe altera??es internas ao Master',()=>{const portal=read('app/api/portal/route.ts');assert.match(portal,/p\.role!=='master'/);assert.match(portal,/p\.role!=='cliente'/)});

