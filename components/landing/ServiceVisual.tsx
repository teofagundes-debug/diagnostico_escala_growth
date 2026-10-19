import styles from "./ServiceVisual.module.css";

type Variant="crm"|"ai"|"chat"|"workflow"|"integration"|"insight";

function resolveVariant(label:string):Variant{
  const value=label.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  if(value.includes("crm")||value.includes("oportunidade"))return "crm";
  if(value.includes("inteligencia")||value.includes("agente")||value.includes("maya"))return "ai";
  if(value.includes("atendimento")||value.includes("canal")||value.includes("transferencia")||value.includes("multicanal"))return "chat";
  if(value.includes("processo")||value.includes("agenda")||value.includes("follow")||value.includes("reativacao"))return "workflow";
  if(value.includes("integr")||value.includes("proposta"))return "integration";
  return "insight";
}

export function ServiceVisual({label}:{label:string}){
  const variant=resolveVariant(label);
  return <div className={`${styles.visual} ${styles[variant]}`} aria-hidden="true"><svg viewBox="0 0 240 116" role="presentation">
    {variant==="crm"&&<><rect x="12" y="18" width="47" height="72" rx="9"/><rect x="68" y="18" width="47" height="72" rx="9"/><rect className={styles.active} x="124" y="18" width="47" height="72" rx="9"/><rect x="180" y="18" width="47" height="72" rx="9"/><path d="M25 73c39 4 75-4 111-24 22-12 47-17 77-15"/><path d="m203 27 10 7-9 8"/><circle cx="27" cy="73" r="4"/><circle cx="83" cy="67" r="4"/><circle cx="137" cy="48" r="4"/></>}
    {variant==="ai"&&<><path d="M120 18c5 20 15 30 35 35-20 5-30 15-35 35-5-20-15-30-35-35 20-5 30-15 35-35Z"/><circle cx="47" cy="34" r="15"/><circle cx="193" cy="34" r="15"/><circle cx="47" cy="84" r="15"/><circle cx="193" cy="84" r="15"/><path d="M60 40 91 49M180 40l-31 9M60 78l31-17m89 17-31-17"/><path className={styles.active} d="M177 18v12m-6-6h12"/></>}
    {variant==="chat"&&<><rect x="76" y="25" width="112" height="58" rx="16"/><path d="m101 83-18 14 5-20"/><rect className={styles.active} x="18" y="16" width="38" height="32" rx="9"/><rect x="18" y="65" width="38" height="32" rx="9"/><circle cx="211" cy="41" r="18"/><circle cx="211" cy="85" r="18"/><path d="M56 32h20m-20 49h20m112-31 7-4m-7 31 7 4"/><path d="M101 45h62M101 61h44"/></>}
    {variant==="workflow"&&<><rect x="12" y="39" width="42" height="38" rx="10"/><rect x="99" y="39" width="42" height="38" rx="10"/><rect className={styles.active} x="186" y="14" width="42" height="38" rx="10"/><rect x="186" y="65" width="42" height="38" rx="10"/><path d="M54 58h45m42 0h20c14 0 12-25 25-25M141 58h20c14 0 12 26 25 26"/><path d="m91 51 8 7-8 7m87-39 8 7-8 7m0 37 8 7-8 7"/><circle cx="120" cy="58" r="6"/></>}
    {variant==="integration"&&<><rect x="92" y="30" width="56" height="56" rx="14"/><path className={styles.active} d="m105 53 15-9 15 9-15 9-15-9Zm0 12 15 9 15-9"/><rect x="12" y="12" width="43" height="36" rx="10"/><rect x="185" y="12" width="43" height="36" rx="10"/><rect x="12" y="69" width="43" height="36" rx="10"/><rect x="185" y="69" width="43" height="36" rx="10"/><path d="M55 30c25 0 18 28 37 28m93-28c-25 0-18 28-37 28M55 87c25 0 18-29 37-29m93 29c-25 0-18-29-37-29"/><circle cx="72" cy="34" r="3"/><circle cx="168" cy="34" r="3"/><circle cx="72" cy="82" r="3"/><circle cx="168" cy="82" r="3"/></>}
    {variant==="insight"&&<><path d="M32 89V59m33 30V42m33 47V67m33 22V26"/><path className={styles.active} d="m23 43 45-17 34 20 61-29"/><circle cx="23" cy="43" r="5"/><circle cx="68" cy="26" r="5"/><circle cx="102" cy="46" r="5"/><circle cx="163" cy="17" r="5"/><rect x="177" y="30" width="49" height="59" rx="10"/><path d="M190 49h23m-23 13h23m-23 13h15"/></>}
  </svg></div>
}
