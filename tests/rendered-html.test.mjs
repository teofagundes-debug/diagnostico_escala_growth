import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const root=new URL('../',import.meta.url);
test('inclui os cinco pilares e 25 perguntas',async()=>{const source=await readFile(new URL('lib/diagnostic.ts',root),'utf8');for(const p of ['atrair','organizar','acompanhar','converter','crescer'])assert.match(source,new RegExp(`id:'${p}'`));assert.equal((source.match(/questions:\[/g)||[]).length,5)});
test('mantém os limites de maturidade',async()=>{const source=await readFile(new URL('lib/diagnostic.ts',root),'utf8');for(const limit of ['p<=20','p<=40','p<=60','p<=80'])assert.ok(source.includes(limit));assert.ok(source.includes('score*5'))});
test('não expõe segredo no cliente',async()=>{const page=await readFile(new URL('components/DiagnosticApp.tsx',root),'utf8');assert.doesNotMatch(page,/SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY/)});

