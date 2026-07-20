import {access} from '../../../lib/access';

const URL=process.env.SUPABASE_URL,ANON=process.env.SUPABASE_ANON_KEY;
const cookie=(name:string,value:string,maxAge:number)=>`${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
const jsonWithCookies=(body:any,status:number,cookies:string[]=[])=>{
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8'});
 cookies.forEach(value=>headers.append('Set-Cookie',value));
 return new Response(JSON.stringify(body),{status,headers});
};
async function userFromToken(token:string){
 return fetch(`${URL}/auth/v1/user`,{headers:{apikey:ANON!,Authorization:`Bearer ${token}`},cache:'no-store'});
}
async function refreshSession(refreshToken:string){
 const response=await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`,{
  method:'POST',
  headers:{'Content-Type':'application/json','apikey':ANON!},
  body:JSON.stringify({refresh_token:refreshToken}),
  cache:'no-store'
 });
 if(!response.ok)return null;
 return response.json();
}
export async function POST(req:Request){
 if(!URL||!ANON)return Response.json({error:'Supabase Auth não configurado'},{status:503});
 const {email,password}=await req.json();
 const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON},body:JSON.stringify({email,password})});
 const data=await r.json();
 if(!r.ok)return Response.json({error:'E-mail ou senha inválidos'},{status:401});
 if(process.env.SUPABASE_SERVICE_ROLE_KEY){
  const now=new Date().toISOString();
  await fetch(`${URL}/rest/v1/portal_usuarios?email=eq.${encodeURIComponent(String(data.user?.email||'').toLowerCase())}`,{method:'PATCH',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({ultimo_acesso_em:now,status_acesso:'Acesso ativado',updated_at:now})});
 }
 return jsonWithCookies({user:data.user},200,[
  cookie('escala_session',data.access_token,Number(data.expires_in||3600)),
  cookie('escala_refresh',data.refresh_token,60*60*24*30)
 ]);
}
export async function GET(req:Request){
 if(!URL||!ANON)return Response.json({user:null},{status:401});
 const rawCookie=req.headers.get('cookie')||'';
 let token=rawCookie.match(/escala_session=([^;]+)/)?.[1];
 const refreshToken=rawCookie.match(/escala_refresh=([^;]+)/)?.[1];
 let renewed:any=null;
 let auth=token?await userFromToken(token):null;
 if((!auth||!auth.ok)&&refreshToken){
  renewed=await refreshSession(refreshToken);
  if(renewed?.access_token){
   token=renewed.access_token;
   auth=await userFromToken(token!);
  }
 }
 if(!token||!auth?.ok)return jsonWithCookies({user:null},401,[
  cookie('escala_session','',0),
  cookie('escala_refresh','',0)
 ]);
 const requestHeaders=new Headers(req.headers);
 const sessionCookie=`escala_session=${token}`;
 requestHeaders.set('cookie',rawCookie.match(/escala_session=[^;]*/)?rawCookie.replace(/escala_session=[^;]*/,sessionCookie):[rawCookie,sessionCookie].filter(Boolean).join('; '));
 const current=await access(new Request(req.url,{method:'GET',headers:requestHeaders}));
 const cookies=renewed?[
  cookie('escala_session',renewed.access_token,Number(renewed.expires_in||3600)),
  cookie('escala_refresh',renewed.refresh_token||refreshToken,60*60*24*30)
 ]:[];
 return jsonWithCookies({user:await auth.json(),role:current?.role||null,empresa_id:current?.empresa_id||null},200,cookies);
}
export async function DELETE(){
 const headers=new Headers();
 headers.append('Set-Cookie',cookie('escala_session','',0));
 headers.append('Set-Cookie',cookie('escala_refresh','',0));
 return new Response(null,{status:204,headers});
}
