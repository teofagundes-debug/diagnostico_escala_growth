export const CAMPAIGN_ATTRIBUTION_VERSION=1 as const;
export const CAMPAIGN_ATTRIBUTION_WINDOW_DAYS=90;
export const CAMPAIGN_ATTRIBUTION_COOKIE='escala_attribution_v1';
export const CAMPAIGN_ATTRIBUTION_STORAGE='escala-growth-attribution:v1';

export type AttributionCaptureSource='URL_QUERY'|'COOKIE'|'LOCAL_STORAGE'|'MIXED';
export type AttributionTouch={
 source?:string;medium?:string;campaign?:string;content?:string;term?:string;
 campaign_id?:string;campaign_name?:string;adset_id?:string;adset_name?:string;
 ad_id?:string;ad_name?:string;placement?:string;click_id?:string;fbclid?:string;gclid?:string;
 landing_page?:string;referrer?:string;captured_at?:string;
};
export type AttributionEnvelope={version:1;first_touch:AttributionTouch;last_touch:AttributionTouch};
export type BrowserAttribution={envelope:AttributionEnvelope|null;capture_source:AttributionCaptureSource|null};

const QUERY_FIELDS={utm_source:'source',utm_medium:'medium',utm_campaign:'campaign',utm_content:'content',utm_term:'term',campaign_id:'campaign_id',campaign_name:'campaign_name',adset_id:'adset_id',adset_name:'adset_name',ad_id:'ad_id',ad_name:'ad_name',placement:'placement',click_id:'click_id',fbclid:'fbclid',gclid:'gclid'} as const;
const TOUCH_FIELDS=['source','medium','campaign','content','term','campaign_id','campaign_name','adset_id','adset_name','ad_id','ad_name','placement','click_id','fbclid','gclid','landing_page','referrer','captured_at'] as const;
const CAMPAIGN_KEYS=['source','medium','campaign','campaign_id','campaign_name','adset_id','adset_name','ad_id','ad_name','click_id','fbclid','gclid'] as const;
const LONG_FIELDS=new Set<string>(['content','term','click_id','fbclid','gclid']);
const CONTEXT_FIELDS=new Set<string>(['landing_page','referrer']);
const COMPACT_COOKIE_FIELDS=['referrer','content','term','campaign_name','adset_name','ad_name'] as const;
const MAX_COOKIE_VALUE_LENGTH=3600;
const DAY_MS=86400000;

function cleanText(value:unknown,field:string){
 if(typeof value!=='string')return undefined;
 const normalized=value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(!normalized)return undefined;
 const limit=CONTEXT_FIELDS.has(field)?240:LONG_FIELDS.has(field)?160:96;
 return normalized.slice(0,limit);
}
function cleanLanding(value:unknown){
 const text=cleanText(value,'landing_page');if(!text)return undefined;
 try{const parsed=new URL(text,'https://www.escalavendas.com.br');return cleanText(parsed.pathname,'landing_page')}catch{return text.startsWith('/')?text:undefined}
}
function cleanReferrer(value:unknown){
 const text=cleanText(value,'referrer');if(!text)return undefined;
 try{const parsed=new URL(text);return ['http:','https:'].includes(parsed.protocol)?cleanText(parsed.origin+parsed.pathname,'referrer'):undefined}catch{return undefined}
}
function cleanCapturedAt(value:unknown){
 if(typeof value!=='string')return undefined;const date=new Date(value);return Number.isFinite(date.getTime())?date.toISOString():undefined;
}
export function sanitizeAttributionTouch(input:unknown):AttributionTouch|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const source=input as Record<string,unknown>,touch:AttributionTouch={};
 for(const field of TOUCH_FIELDS){
  const value=field==='landing_page'?cleanLanding(source[field]):field==='referrer'?cleanReferrer(source[field]):field==='captured_at'?cleanCapturedAt(source[field]):cleanText(source[field],field);
  if(value)touch[field]=value;
 }
 return CAMPAIGN_KEYS.some(key=>Boolean(touch[key]))?touch:null;
}
export function attributionTouchFromSearch(search:string|URLSearchParams,context:{landing_page?:string;referrer?:string;captured_at?:string}={}):AttributionTouch|null{
 const params=typeof search==='string'?new URLSearchParams(search.startsWith('?')?search.slice(1):search):search,raw:Record<string,unknown>={};
 for(const [query,touch] of Object.entries(QUERY_FIELDS)){const value=params.get(query);if(value!==null)raw[touch]=value}
 raw.landing_page=context.landing_page;raw.referrer=context.referrer;raw.captured_at=context.captured_at||new Date().toISOString();
 return sanitizeAttributionTouch(raw);
}
function touchTime(touch:AttributionTouch|undefined){const value=touch?.captured_at?new Date(touch.captured_at).getTime():NaN;return Number.isFinite(value)?value:0}
function expired(envelope:AttributionEnvelope,now:Date){const anchor=touchTime(envelope.first_touch)||touchTime(envelope.last_touch);return !anchor||now.getTime()-anchor>CAMPAIGN_ATTRIBUTION_WINDOW_DAYS*DAY_MS||anchor-now.getTime()>DAY_MS}
export function sanitizeAttributionEnvelope(input:unknown,now=new Date()):AttributionEnvelope|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;const raw=input as Record<string,unknown>;
 if(raw.version!==CAMPAIGN_ATTRIBUTION_VERSION)return null;
 const first=sanitizeAttributionTouch(raw.first_touch),last=sanitizeAttributionTouch(raw.last_touch);
 if(!first&&!last)return null;
 const envelope:AttributionEnvelope={version:1,first_touch:first||last!,last_touch:last||first!};
 return expired(envelope,now)?null:envelope;
}
function fingerprint(touch:AttributionTouch){return CAMPAIGN_KEYS.map(key=>`${key}:${touch[key]||''}`).join('|')}
export function applyCampaignTouch(current:unknown,touch:AttributionTouch|null,now=new Date()):AttributionEnvelope|null{
 const existing=sanitizeAttributionEnvelope(current,now);if(!touch)return existing;
 const clean=sanitizeAttributionTouch(touch);if(!clean)return existing;
 if(!existing)return{version:1,first_touch:clean,last_touch:clean};
 if(fingerprint(existing.last_touch)===fingerprint(clean))return existing;
 return{version:1,first_touch:existing.first_touch,last_touch:clean};
}
export function mergeAttributionEnvelopes(inputs:unknown[],now=new Date()):AttributionEnvelope|null{
 const valid=inputs.map(input=>sanitizeAttributionEnvelope(input,now)).filter((item):item is AttributionEnvelope=>Boolean(item));
 if(!valid.length)return null;
 const first=[...valid].map(item=>item.first_touch).sort((a,b)=>touchTime(a)-touchTime(b))[0];
 const last=[...valid].map(item=>item.last_touch).sort((a,b)=>touchTime(b)-touchTime(a))[0];
 return sanitizeAttributionEnvelope({version:1,first_touch:first,last_touch:last},now);
}
export function authorizedTrackingSearch(search:string|URLSearchParams){
 const input=typeof search==='string'?new URLSearchParams(search.startsWith('?')?search.slice(1):search):search,output=new URLSearchParams();
 for(const query of Object.keys(QUERY_FIELDS)){const field=QUERY_FIELDS[query as keyof typeof QUERY_FIELDS],value=cleanText(input.get(query),field);if(value)output.set(query,value)}
 const serialized=output.toString();return serialized?`?${serialized}`:'';
}
function parseStored(value:string|null){if(!value)return null;try{return JSON.parse(decodeURIComponent(value))}catch{try{return JSON.parse(value)}catch{return null}}}
function cookieValue(name:string){if(typeof document==='undefined')return null;const prefix=`${name}=`;return document.cookie.split(';').map(item=>item.trim()).find(item=>item.startsWith(prefix))?.slice(prefix.length)||null}
function persistBrowserEnvelope(envelope:AttributionEnvelope){
 if(typeof window==='undefined')return;
 const serialized=JSON.stringify(envelope);try{localStorage.setItem(CAMPAIGN_ATTRIBUTION_STORAGE,serialized)}catch{}
 const cookieEnvelope:AttributionEnvelope=JSON.parse(serialized);
 for(const field of COMPACT_COOKIE_FIELDS){
  if(encodeURIComponent(JSON.stringify(cookieEnvelope)).length<=MAX_COOKIE_VALUE_LENGTH)break;
  delete cookieEnvelope.first_touch[field];delete cookieEnvelope.last_touch[field];
 }
 const cookieSerialized=encodeURIComponent(JSON.stringify(cookieEnvelope));
 const secure=location.protocol==='https:'?'; Secure':'';document.cookie=`${CAMPAIGN_ATTRIBUTION_COOKIE}=${cookieSerialized}; Max-Age=${CAMPAIGN_ATTRIBUTION_WINDOW_DAYS*86400}; Path=/; SameSite=Lax${secure}`;
}
export function resolveBrowserAttribution():BrowserAttribution{
 if(typeof window==='undefined')return{envelope:null,capture_source:null};
 const now=new Date(),cookie=parseStored(cookieValue(CAMPAIGN_ATTRIBUTION_COOKIE));let stored=null;
 try{stored=parseStored(localStorage.getItem(CAMPAIGN_ATTRIBUTION_STORAGE))}catch{}
 const queryTouch=attributionTouchFromSearch(location.search,{landing_page:location.pathname,referrer:document.referrer,captured_at:now.toISOString()});
 const base=mergeAttributionEnvelopes([cookie,stored],now),envelope=applyCampaignTouch(base,queryTouch,now);
 if(envelope)persistBrowserEnvelope(envelope);
 const sources=[queryTouch?'URL_QUERY':null,sanitizeAttributionEnvelope(cookie,now)?'COOKIE':null,sanitizeAttributionEnvelope(stored,now)?'LOCAL_STORAGE':null].filter(Boolean);
 return{envelope,capture_source:sources.length>1?'MIXED':(sources[0] as AttributionCaptureSource||null)};
}
