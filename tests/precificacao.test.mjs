import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const central=fs.readFileSync('components/CentralApp.tsx','utf8'),admin=fs.readFileSync('components/CommercialAdmin.tsx','utf8'),api=fs.readFileSync('app/api/commercial/route.ts','utf8'),sql=fs.readFileSync('database/migration_v11_parametros_comerciais.sql','utf8');
test('precificação utiliza exclusivamente UI',()=>{for(const x of ['valor_ui','catalogo_recursos','total_ui','valor_implantacao'])assert.ok((central+api+sql).includes(x));assert.ok(!admin.includes('PEG'));assert.ok(!admin.toLowerCase().includes('horas'))});
test('parâmetros e catálogo são administrativos',()=>{assert.ok(api.includes('isAdmin'));assert.ok(api.includes('Acesso exclusivo do administrador'));assert.ok(admin.includes('Legenda Oficial da UI'))});
test('simulador calcula cenários sem empresa',()=>{assert.ok(admin.includes('Simulador Comercial'));assert.ok(admin.includes('totalUi*Number(params.valor_ui)'));assert.ok(admin.includes('Projeto grande'))});

