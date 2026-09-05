-- V75 — payload público e endpoint exclusivo são tratados sobre o outbox existente.
-- Não altera eventos Growth nem recria o fluxo principal de Implantação de Ferramentas.

create or replace function public.normalizar_evento_nimble_ferramentas()
returns trigger
language plpgsql
set search_path=public
as $$
begin
 if new.event_type='solicitacao_ferramentas_concluida'
    and coalesce(new.payload->>'origem','')<>'implantacao_ferramentas' then
  new.payload=jsonb_build_object(
   'origem','implantacao_ferramentas',
   'nome',coalesce(new.payload#>>'{contato,nome}',''),
   'empresa',coalesce(new.payload#>>'{empresa,nome}',''),
   'whatsapp',coalesce(new.payload#>>'{contato,whatsapp}',''),
   'email',coalesce(new.payload#>>'{contato,email}',''),
   'area',coalesce(new.payload#>>'{solicitacao,area_interesse}',''),
   'solucoes',coalesce(new.payload#>'{solicitacao,solucoes}','[]'::jsonb),
   'projeto_id',new.aggregate_id,
   'empresa_id',new.company_id,
   'submitted_at',coalesce(new.payload->>'occurred_at',new.created_at::text)
  );
 end if;
 return new;
end $$;

drop trigger if exists integration_events_nimble_ferramentas_payload on public.integration_events;
create trigger integration_events_nimble_ferramentas_payload
before insert or update of payload on public.integration_events
for each row execute function public.normalizar_evento_nimble_ferramentas();

-- Corrige somente solicitações ainda pendentes; eventos entregues permanecem históricos e imutáveis.
update public.integration_events
set payload=payload
where event_type='solicitacao_ferramentas_concluida'
  and status='PENDING';

notify pgrst,'reload schema';
