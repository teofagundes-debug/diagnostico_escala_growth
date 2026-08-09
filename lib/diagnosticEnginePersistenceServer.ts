import {ensureDiagnosticEngineResults,EngineMaterializationError} from './diagnosticEnginePersistence';
export {EngineMaterializationError};

export async function ensureDiagnosticEngineResultsPersisted(diagnosticId:string,report:any,loadAnswers:()=>Promise<any[]>,persist:(report:any)=>Promise<void>){
 const answers=await loadAnswers();
 const result=ensureDiagnosticEngineResults(report,answers,diagnosticId);
 if(result.changed)await persist(result.report);
 return result;
}
