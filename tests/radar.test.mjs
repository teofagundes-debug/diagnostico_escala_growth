import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('Master cadastra URL e status no dossie',()=>{const ui=read('components/CentralApp.tsx'),api=read('app/api/dossiers/route.ts');for(const x of ['RadarAdmin','radar_comercial_url','radar_comercial_status','Salvar Radar Comercial','Abrir Radar Comercial'])assert.ok((ui+api).includes(x));assert.ok(api.includes('isMaster'))});
test('cliente recebe somente o radar da propria empresa quando ativo',()=>{const api=read('app/api/portal/route.ts');assert.ok(api.includes("radar_comercial_status==='Ativo'"));assert.ok(api.includes('delete clientCompany.radar_comercial_url'));assert.ok(api.includes('commercialRadar'))});
test('Portal possui pagina incorporada fallback e estado amigavel',()=>{const ui=read('components/PortalApp.tsx');for(const x of ['/portal/radar','RadarCommercial','<iframe','Abrir Radar Comercial','JourneyRadarCard'])assert.ok(ui.includes(x));assert.ok(ui.includes('sendo preparado'))});
test('migration cria campos individuais por empresa',()=>{const sql=read('database/migration_v15_radar_comercial.sql');assert.ok(sql.includes('alter table public.empresas'));assert.ok(sql.includes('radar_comercial_url'));assert.ok(sql.includes('radar_comercial_status'))});
