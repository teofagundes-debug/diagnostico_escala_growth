import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('components/DiagnosticApp.tsx','utf8');
const api=fs.readFileSync('app/api/diagnostics/route.ts','utf8');

test('diagnóstico não usa keepalive para enviar payload completo',()=>{
  const finish=app.slice(app.indexOf('const finish='),app.indexOf('const reset='));
  assert.ok(!finish.includes('keepalive:true'));
  assert.ok(finish.includes('if(!response.ok||!body.ok)'));
});

test('resultado só é exibido depois da confirmação da persistência',()=>{
  const finish=app.slice(app.indexOf('const finish='),app.indexOf('const reset='));
  assert.ok(finish.indexOf("setScreen('result')")>finish.indexOf('if(!response.ok||!body.ok)'));
  assert.ok(app.includes('Suas respostas foram preservadas. Tente novamente.'));
  assert.ok(app.includes('disabled={saving}'));
});

test('API padroniza sucesso e falha do registro',()=>{
  assert.ok(api.includes("Response.json({ok:true,diagnostico_id:await r.json()},{status:201})"));
  assert.ok(api.includes("Response.json({ok:false,error:'Não foi possível registrar o diagnóstico na Central.'}"));
  assert.ok(api.includes("console.error('[diagnostics] Falha ao registrar diagnóstico'"));
});
