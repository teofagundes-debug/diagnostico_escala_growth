import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const central=readFileSync("components/CentralApp.tsx","utf8");
const api=readFileSync("app/api/diagnostics/route.ts","utf8");
const migration=readFileSync("database/migration_v8_dossie_empresa.sql","utf8");
const publicApp=readFileSync("components/DiagnosticApp.tsx","utf8");

test("dossiê concentra missão, timeline, evolução e observações",()=>{
 for(const text of ["Próxima Missão","Jornada da empresa","Evolução da maturidade","Observações internas do consultor"]) assert.match(central,new RegExp(text));
});

test("diagnósticos ganham sequência e são duplicados sem substituir histórico",()=>{
 assert.match(migration,/sequencia integer/);
 assert.match(migration,/duplicar_diagnostico_growth/);
 assert.match(migration,/insert into public\.diagnosticos/);
});

test("exclusão exige administrador e confirmação",()=>{
 assert.match(api,/Apenas o administrador pode excluir diagnósticos/);
 assert.match(central,/Excluir definitivamente este diagnóstico/);
});

test("certificado não é mais emitido no relatório inicial",()=>{
 assert.doesNotMatch(publicApp,/className="certificate report-section"/);
 assert.match(central,/certificate_eligible/);
});
