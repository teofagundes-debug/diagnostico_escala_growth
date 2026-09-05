import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

const api=readFileSync('app/api/client-access/route.ts','utf8');

test('reenvio usa a existência real no Auth e não força recovery',()=>{
 assert.match(api,/generated = await generateLink\(email, isExisting\)/);
 assert.doesNotMatch(api,/isExisting \|\| action === 'resend' \|\| action === 'reset'/);
});

test('recovery inexistente volta uma vez para invite sem loop',()=>{
 assert.match(api,/existing&&\/user_not_found\|not found\/i\.test\(message\).*generateLink\(email,false,true\)/);
 assert.match(api,/!existing&&\/already\|registered\|exists\/i\.test\(message\).*generateLink\(email,true,true\)/);
 assert.match(api,/retried=false/);
});

test('e-mail acompanha o tipo de link realmente gerado',()=>{
 assert.match(api,/existing: generated\.recovery/);
 assert.match(api,/recovery:type==='recovery'/);
});
