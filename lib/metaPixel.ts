const PIXEL_ID=process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()||'';
const SCRIPT_ID='meta-pixel-script';
const PAGE_VIEW_KEY='escala_meta_pageview_escala_growth_v1';

type MetaPixelCommand=(...args:unknown[])=>void;

declare global {
 interface Window {fbq?:MetaPixelCommand;_fbq?:MetaPixelCommand}
}

function browserReady(){return typeof window!=='undefined'&&typeof document!=='undefined'&&Boolean(PIXEL_ID)}
function once(key:string,callback:()=>void){
 if(!browserReady())return;
 try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch{}
 callback();
}

export function initMetaPixel(){
 if(!browserReady())return false;
 if(!window.fbq){
  const fbq:MetaPixelCommand=function(...args:unknown[]){(fbq as MetaPixelCommand&{queue?:unknown[][]}).queue?.push(args)};
  Object.assign(fbq,{push:fbq,loaded:true,version:'2.0',queue:[]});
  window.fbq=fbq;window._fbq=fbq;
 }
 if(!document.getElementById(SCRIPT_ID)){
  const script=document.createElement('script');script.id=SCRIPT_ID;script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
 }
 const state=window as Window&{__escalaMetaPixelInitialized?:boolean};
 if(!state.__escalaMetaPixelInitialized){window.fbq?.('init',PIXEL_ID);state.__escalaMetaPixelInitialized=true}
 return true;
}

export function trackPageView(){
 once(PAGE_VIEW_KEY,()=>{if(initMetaPixel())window.fbq?.('track','PageView')});
}

export function trackDiagnosticStarted(){
 if(!initMetaPixel()||!window.fbq)return false;
 window.fbq('trackCustom','DiagnosticStarted');
 return true;
}

export function leadEventId(diagnosticId:string){return `diagnostico-${diagnosticId}-lead`}

export function trackLead(diagnosticId:string){
 if(!diagnosticId||!initMetaPixel())return null;
 const eventId=leadEventId(diagnosticId),key=`escala_meta_lead_${diagnosticId}`;
 once(key,()=>window.fbq?.('track','Lead',{content_name:'Diagnostico Escala Growth',content_category:'Diagnostico Comercial'},{eventID:eventId}));
 return eventId;
}

export function metaPixelConfigured(){return Boolean(PIXEL_ID)}
