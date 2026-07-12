const URL=process.env.SUPABASE_URL,ANON=process.env.SUPABASE_ANON_KEY;
export async function POST(req:Request){
 if(!URL||!ANON)return Response.json({error:'Supabase Auth não configurado'},{status:503});
 const {email,password}=await req.json();
 const r=await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON},body:JSON.stringify({email,password})});
 const data=await r.json();
 if(!r.ok)return Response.json({error:'E-mail ou senha inválidos'},{status:401});
 return new Response(JSON.stringify({user:data.user}),{headers:{'Content-Type':'application/json','Set-Cookie':`escala_session=${data.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${data.expires_in}`}});
}
export async function GET(req:Request){
 const token=req.headers.get('cookie')?.match(/escala_session=([^;]+)/)?.[1];
 if(!token||!URL||!ANON)return Response.json({user:null},{status:401});
 const r=await fetch(`${URL}/auth/v1/user`,{headers:{apikey:ANON,Authorization:`Bearer ${token}`}});
 if(!r.ok)return Response.json({user:null},{status:401});
 return Response.json({user:await r.json()});
}
export async function DELETE(){return new Response(null,{status:204,headers:{'Set-Cookie':'escala_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'}})}

