import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeBrazilianWhatsApp} from '../lib/brazilianWhatsapp.ts';

test('normaliza formatos brasileiros aceitos para o mesmo valor canônico',()=>{
  for(const value of ['(41) 99999-9999','41 99999-9999','41999999999','+55 41 99999-9999']){
    assert.equal(normalizeBrazilianWhatsApp(value),'5541999999999');
  }
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
