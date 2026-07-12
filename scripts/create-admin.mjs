const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
const email='teofagundes@gmail.com',password='EscalaGrowth@2026';
const h={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
const list=await fetch(`${url}/auth/v1/admin/users?per_page=1000`,{headers:h}).then(r=>r.json());
if(list.users?.some(u=>u.email===email))console.log('Usuário administrador já existe:',email);
else{const r=await fetch(`${url}/auth/v1/admin/users`,{method:'POST',headers:h,body:JSON.stringify({email,password,email_confirm:true,user_metadata:{name:'Teófilo Oliveira Fagundes',role:'admin'}})});if(!r.ok)throw new Error(await r.text());console.log('Usuário administrador criado:',email)}

