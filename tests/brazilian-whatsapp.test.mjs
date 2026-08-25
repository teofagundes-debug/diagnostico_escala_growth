import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeBrazilianWhatsApp} from '../lib/brazilianWhatsapp.ts';

test('DDDs canônicos de nove dígitos preservam ou adicionam o 9',()=>{
  const cases=[
    ['(11) 99699-5523','5511996995523'],
    ['11 9699-5523','5511996995523'],
    ['+55 (11) 99699-5523','5511996995523'],
    ['(19) 9699-5523','5519996995523'],
    ['19 99699-5523','5519996995523'],
    ['(22) 9699-5523','5522996995523'],
    ['22 99699-5523','5522996995523'],
    ['(28) 9699-5523','5528996995523'],
    ['28 99699-5523','5528996995523'],
  ];
  for(const [input,expected] of cases)assert.equal(normalizeBrazilianWhatsApp(input),expected);
});

test('demais DDDs preservam oito dígitos ou removem o 9 inicial',()=>{
  const cases=[
    ['(41) 99699-5523','554196995523'],
    ['41 9699-5523','554196995523'],
    ['+55 (41) 99699-5523','554196995523'],
    ['(21) 99699-5523','552196995523'],
    ['21 9699-5523','552196995523'],
    ['(31) 99699-5523','553196995523'],
    ['31 9699-5523','553196995523'],
  ];
  for(const [input,expected] of cases)assert.equal(normalizeBrazilianWhatsApp(input),expected);
});

test('remove espaços, parênteses e hífens e aceita entrada com ou sem 55',()=>{
  for(const value of ['(41) 99699-5523','41 99699 5523','41996995523','+55 (41) 99699-5523']){
    assert.equal(normalizeBrazilianWhatsApp(value),'554196995523');
  }
});

test('normalização é idempotente',()=>{
  const normalized='554196995523';
  assert.equal(normalizeBrazilianWhatsApp(normalized),normalized);
  assert.equal(normalizeBrazilianWhatsApp(normalizeBrazilianWhatsApp(normalized)),normalized);
});

test('rejeita WhatsApp vazio, incompleto ou evidentemente inválido',()=>{
  for(const value of ['',null,'419999','00123456789','11111111111','41123456789']){
    assert.equal(normalizeBrazilianWhatsApp(value),null);
  }
});

test('aceita número fixo brasileiro que pode operar no WhatsApp',()=>{
  assert.equal(normalizeBrazilianWhatsApp('(41) 3333-4444'),'554133334444');
});

test('formulário exige WhatsApp e apresenta exemplo brasileiro',()=>{
  const source=fs.readFileSync(new URL('../components/DiagnosticApp.tsx',import.meta.url),'utf8');
  assert.match(source,/\['phone','WhatsApp \*'\]/);
  assert.match(source,/placeholder=\{k==='phone'\?'\(41\) 99999-9999'/);
  assert.match(source,/normalizeBrazilianWhatsApp\(company\.phone\)/);
});

test('backend normaliza antes de chamar a RPC e mantém duplicação histórica separada',()=>{
  const source=fs.readFileSync(new URL('../app/api/diagnostics/route.ts',import.meta.url),'utf8');
  const duplicate=source.indexOf("payload.action==='duplicate'");
  const normalize=source.indexOf('normalizeBrazilianWhatsApp(payload.telefone)');
  const persist=source.indexOf("rpc/registrar_diagnostico_growth");
  assert.ok(duplicate>=0&&normalize>duplicate&&persist>normalize);
  assert.match(source,/payload\.telefone=whatsapp/);
  assert.match(source,/status:400/);
});

test('webhook diagnostico_concluido usa o WhatsApp canônico persistido sem nova transformação',()=>{
  const migration=fs.readFileSync(new URL('../database/migration_v65_diagnostico_concluido_outbox.sql',import.meta.url),'utf8');
  assert.match(migration,/'contato',jsonb_build_object\([\s\S]*'whatsapp',coalesce\(persisted_contact\.telefone,''\)/);
});
