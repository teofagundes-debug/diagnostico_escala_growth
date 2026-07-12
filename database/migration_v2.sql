-- Migração v2 — fluxo consultivo e Plano Estratégico Escala Growth
alter table diagnosticos add column if not exists status text not null default 'Diagnóstico Concluído';
alter table diagnosticos add column if not exists potencial_crescimento text;
alter table diagnosticos add column if not exists parecer text;
alter table diagnosticos add column if not exists plano_acao jsonb default '[]'::jsonb;
alter table diagnosticos add column if not exists certificado jsonb default '{}'::jsonb;
alter table diagnosticos add column if not exists relatorio_snapshot jsonb default '{}'::jsonb;
alter table diagnosticos add column if not exists relatorio_pdf text;
alter table diagnosticos add column if not exists updated_at timestamptz default now();

create table if not exists planos_estrategicos(
 id uuid primary key default gen_random_uuid(), empresa_id uuid references empresas on delete cascade,
 diagnostico_id uuid unique references diagnosticos on delete cascade, consultor text default 'Teófilo Oliveira Fagundes',
 status text default 'Rascunho', resumo text, situacao_atual text, objetivos text, prioridades text,
 riscos text, cronograma text, proximos_passos text, observacoes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists diagnostico_status_historico(
 id uuid primary key default gen_random_uuid(), diagnostico_id uuid references diagnosticos on delete cascade,
 status text not null, created_at timestamptz default now()
);
alter table planos_estrategicos enable row level security;
alter table diagnostico_status_historico enable row level security;

create or replace function registrar_diagnostico_growth(payload jsonb) returns uuid language plpgsql security definer as $$
declare e uuid; r uuid; d uuid; item jsonb;
begin
 insert into empresas(nome,segmento,cidade,estado) values(payload->>'empresa',payload->>'segmento',payload->>'cidade',payload->>'estado') returning id into e;
 insert into responsaveis(empresa_id,nome,email,telefone) values(e,payload->>'responsavel',payload->>'email',payload->>'telefone') returning id into r;
 insert into diagnosticos(empresa_id,responsavel_id,data_diagnostico,pontuacao_geral,percentual_geral,nivel_maturidade,maior_pilar,menor_pilar,potencial_crescimento,status,parecer,plano_acao,certificado,relatorio_snapshot)
 values(e,r,(payload->>'data')::date,(payload->>'ieg')::int,(payload->>'ieg')::int,payload->>'nivel',payload->>'maior_forca',payload->>'maior_gargalo',payload->>'potencial','Diagnóstico Concluído',payload->>'parecer',payload->'plano_acao',payload->'certificado',payload->'relatorio') returning id into d;
 for item in select * from jsonb_array_elements(payload->'radar') loop insert into resultados_pilares(diagnostico_id,pilar,pontuacao,percentual) values(d,item->>'label',(item->>'score')::int,(item->>'percent')::int); end loop;
 for item in select * from jsonb_array_elements(payload->'respostas') loop insert into respostas(diagnostico_id,pilar,pergunta,resposta_numerica) values(d,item->>'pilar',item->>'pergunta',(item->>'valor')::int); end loop;
 for item in select * from jsonb_array_elements(payload->'respostas_abertas') loop insert into respostas_abertas(diagnostico_id,pergunta,resposta) values(d,item->>'pergunta',item->>'resposta'); end loop;
 insert into diagnostico_status_historico(diagnostico_id,status) values(d,'Diagnóstico Concluído');
 insert into planos_estrategicos(empresa_id,diagnostico_id,resumo,situacao_atual,objetivos,prioridades,riscos,proximos_passos)
 values(e,d,payload->>'parecer',payload->>'nivel',payload->>'objetivos',payload->>'prioridades',payload->>'riscos',payload->>'proximos_passos');
 return d;
end $$;

