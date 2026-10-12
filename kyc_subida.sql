-- Restaura la subida de cedulas (solo usuarios logueados, solo a carpetas con numero de cedula)
drop policy if exists "Registro sube su cedula kyc" on storage.objects;
create policy "Registro sube su cedula kyc"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kyc-documentos'
    and name ~ '^[0-9]{6,13}/cedula_(frontal|posterior)(_[0-9]+)?\.(webp|jpg|jpeg|png|pdf)$'
  );

-- Permite que cada usuario registre SUS fotos en SU suscripcion (sin poder cambiar el estado de verificacion a "verificado")
create or replace function public.guardar_cedula_kyc(p_frontal text, p_posterior text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := auth.uid();
  v_ced text;
begin
  if v_id is null then raise exception 'No autenticado'; end if;
  select cedula into v_ced from usuarios where id = v_id;
  if v_ced is null or v_ced !~ '^[0-9]+$' then raise exception 'Perfil sin cedula valida'; end if;
  if p_frontal  !~ ('^' || v_ced || '/cedula_frontal(_[0-9]+)?\.(webp|jpg|jpeg|png|pdf)$')
  or p_posterior !~ ('^' || v_ced || '/cedula_posterior(_[0-9]+)?\.(webp|jpg|jpeg|png|pdf)$') then
    raise exception 'Ruta de archivo invalida';
  end if;
  update suscripciones
     set cedula_frontal_url = p_frontal,
         cedula_posterior_url = p_posterior,
         kyc_estado = 'pendiente',
         kyc_motivo_rechazo = null
   where titular_id = v_id
     and coalesce(kyc_estado, 'pendiente') <> 'verificado';
end;
$$;

revoke all on function public.guardar_cedula_kyc(text, text) from public, anon;
grant execute on function public.guardar_cedula_kyc(text, text) to authenticated;

-- Verificacion
select policyname, cmd from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('Registro sube su cedula kyc','Solo admin lee kyc');
