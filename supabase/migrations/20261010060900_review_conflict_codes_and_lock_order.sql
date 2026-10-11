-- Deterministic business conflicts must not use serialization_failure (40001).
-- PostgREST 14 retries that SQLSTATE inside its server, even when SDK retries are
-- disabled. PT409 returns one HTTP 409 without an automatic transaction retry.
-- Keep global budget -> organization -> child row lock order across mutations.
-- Replaces only the existing function; grants, tenant RLS and worker proof remain.
create or replace function review_private.mutate(p_action text,p_org uuid,p_data jsonb,p_secret text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid(); actor_role text; result jsonb; subject uuid; org_id uuid := p_org;
  laptop public.review_laptops; change_row public.review_changes; job public.review_jobs;
  invite review_private.invites; runtime review_private.runtime; checkpoint review_private.job_checkpoints;
  org public.review_organizations; budget public.review_budgets; current_period date := date_trunc('month',now())::date;
  token text; amount integer; charge integer; final_status text; role_requested text; trusted boolean := false;
begin
  if actor is null or not exists(select 1 from auth.users where id=actor and coalesce(is_anonymous,false)=false) then
    raise exception 'Sign in required' using errcode='28000';
  end if;
  if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Invalid request' using errcode='22023'; end if;
  if p_action in ('connectProject','reserveJob','claimJob','completeJob','saveCheckpoint') then
    select * into runtime from review_private.runtime where singleton=true;
    trusted := length(coalesce(p_secret,'')) >= 32 and runtime.worker_secret_hash=encode(sha256(convert_to(p_secret,'UTF8')),'hex');
    if trusted is distinct from true then raise exception 'Trusted worker required' using errcode='42501'; end if;
  end if;
  if p_action='createOrganization' then
    perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
    if (select count(*) from public.review_memberships where user_id=actor and role='owner')>=3 then raise exception 'Organization limit reached' using errcode='P0001'; end if;
    insert into public.review_organizations(name,created_by) values(trim(p_data->>'name'),actor) returning * into org;
    org_id:=org.id; subject:=org.id;
    insert into public.review_memberships(organization_id,user_id,role) values(org.id,actor,'owner');
    insert into public.review_budgets(organization_id,period) values(org.id,current_period);
    result:=to_jsonb(org);
  elsif p_action='redeemInvite' then
    select * into invite from review_private.invites where token_hash=encode(sha256(convert_to(p_data->>'token','UTF8')),'hex') for update;
    if not found or invite.redeemed_by is not null or invite.expires_at<=now() then raise exception 'Invite expired or unavailable' using errcode='P0002'; end if;
    if not exists(select 1 from public.review_memberships where organization_id=invite.organization_id and user_id=invite.created_by and role in ('owner','admin')) then raise exception 'Invite issuer no longer authorized' using errcode='42501'; end if;
    insert into public.review_memberships(organization_id,user_id,role) values(invite.organization_id,actor,invite.role) on conflict do nothing;
    update review_private.invites set redeemed_by=actor where token_hash=invite.token_hash;
    org_id:=invite.organization_id; subject:=actor;
    select to_jsonb(o) into result from public.review_organizations o where o.id=org_id;
  else
    actor_role:=review_private.member_role(p_org);
    if actor_role is null then raise exception 'Organization unavailable' using errcode='P0002'; end if;
    if p_action in ('setBudget','createInvite','connectProject') and actor_role not in ('owner','admin') then raise exception 'Administrator role required' using errcode='42501'; end if;
    if p_action in ('createLaptop','addEvidence','createChange','reserveJob','claimJob','completeJob','cancelJob','saveCheckpoint') and actor_role not in ('owner','admin','reviewer','technician') then raise exception 'Write access required' using errcode='42501'; end if;
    -- Every existing-organization mutation takes its organization lock before
    -- child rows. Budget/job paths first take the shared runtime lock. This avoids
    -- approval -> audit FK / reservation -> change lock cycles. NO KEY UPDATE
    -- remains compatible with the KEY SHARE locks used by foreign-key checks.
    if p_action in ('reserveJob','claimJob','completeJob','cancelJob','saveCheckpoint') then
      select * into runtime from review_private.runtime where singleton=true for update;
    end if;
    select * into org from public.review_organizations where id=p_org for no key update;
    if not found then raise exception 'Organization unavailable' using errcode='P0002'; end if;
    if p_action='setBudget' then
      amount:=(p_data->>'monthlyBudgetCents')::integer;
      if amount is null or amount<0 or amount>10000 then raise exception 'Budget must be between 0 and 10000 cents' using errcode='22023'; end if;
      if amount>(select budget_limit_cents from review_private.runtime where singleton=true) then raise exception 'Budget exceeds the service ceiling' using errcode='22023'; end if;
      update public.review_organizations set monthly_budget_cents=amount where id=p_org returning * into org;
      subject:=org.id; result:=to_jsonb(org);
    elsif p_action='createInvite' then
      role_requested:=p_data->>'role';
      if role_requested not in ('admin','reviewer','technician','viewer') or role_requested is null or (role_requested='admin' and actor_role<>'owner') then raise exception 'Role cannot be granted' using errcode='42501'; end if;
      token:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
      insert into review_private.invites(token_hash,organization_id,role,created_by) values(encode(sha256(convert_to(token,'UTF8')),'hex'),p_org,role_requested,actor) returning * into invite;
      result:=jsonb_build_object('token',token,'expiresAt',invite.expires_at);
    elsif p_action='createLaptop' then
      insert into public.review_laptops(organization_id,asset_tag,manufacturer,model,operating_system)
      values(p_org,trim(p_data->>'assetTag'),trim(p_data->>'manufacturer'),trim(p_data->>'model'),trim(p_data->>'operatingSystem')) returning * into laptop;
      subject:=laptop.id; result:=to_jsonb(laptop);
    elsif p_action='addEvidence' then
      select * into laptop from public.review_laptops where id=(p_data->>'laptopId')::uuid and organization_id=p_org for update;
      if not found then raise exception 'Laptop unavailable' using errcode='P0002'; end if;
      update public.review_laptops set evidence_version=evidence_version+1 where id=laptop.id returning * into laptop;
      insert into public.review_evidence(organization_id,laptop_id,version,kind,content,source,created_by)
      values(p_org,laptop.id,laptop.evidence_version,p_data->>'kind',p_data->>'content',p_data->>'source',actor) returning to_jsonb(review_evidence.*) into result;
      -- A published PR remains recorded, but new evidence invalidates its old verification/approval.
      update public.review_changes set approval=null,verification=null,
        status=case when status='published' then 'published' else 'needs_evidence' end,updated_at=now()
        where organization_id=p_org and laptop_id=laptop.id;
      subject:=laptop.id;
    elsif p_action='connectProject' then
      if exists(select 1 from public.review_jobs j join public.review_changes c on c.id=j.change_id join public.review_projects p on p.id=c.project_id
        where p.organization_id=p_org and p.repository=p_data->>'repository' and j.status in ('queued','running','waiting')) then raise exception 'Wait for the current stage before changing repository settings' using errcode='PT409'; end if;
      insert into public.review_projects(organization_id,name,repository,repository_id,installation_id,default_branch,target_path,test_paths)
      values(p_org,p_data->>'repository',p_data->>'repository',(p_data->>'repositoryId')::bigint,(p_data->>'installationId')::bigint,p_data->>'defaultBranch',p_data->>'targetPath',p_data->'testPaths')
      on conflict(organization_id,repository) do update set repository_id=excluded.repository_id,installation_id=excluded.installation_id,default_branch=excluded.default_branch,target_path=excluded.target_path,test_paths=excluded.test_paths
      returning to_jsonb(review_projects.*),id into result,subject;
      update public.review_changes set approval=null,verification=null,patch=null,patch_hash=null,base_commit=null,review_summary=null,
        status=case when status='published' then 'published' else 'open' end,updated_at=now() where project_id=subject;
      delete from review_private.change_artifacts where change_id in(select id from public.review_changes where project_id=subject);
    elsif p_action='createChange' then
      select * into laptop from public.review_laptops where id=(p_data->>'laptopId')::uuid and organization_id=p_org;
      if not found then raise exception 'Laptop unavailable' using errcode='P0002'; end if;
      insert into public.review_changes(organization_id,laptop_id,project_id,title,description,evidence_version,model_tier,created_by)
      values(p_org,laptop.id,nullif(p_data->>'projectId','')::uuid,trim(p_data->>'title'),trim(p_data->>'description'),laptop.evidence_version,p_data->>'modelTier',actor)
      returning * into change_row;
      subject:=change_row.id; result:=to_jsonb(change_row);
    elsif p_action='approveChange' then
      if actor_role not in ('owner','admin','reviewer') then raise exception 'Reviewer role required' using errcode='42501'; end if;
      select * into change_row from public.review_changes where id=(p_data->>'changeId')::uuid and organization_id=p_org for update;
      if not found then raise exception 'Change unavailable' using errcode='P0002'; end if;
      if change_row.created_by=actor then raise exception 'A different person must approve this change' using errcode='42501'; end if;
      if change_row.status<>'awaiting_approval' or change_row.evidence_version is distinct from (p_data->>'evidenceVersion')::integer
        or change_row.evidence_version is distinct from (select evidence_version from public.review_laptops where id=change_row.laptop_id)
        or change_row.base_commit is distinct from p_data->>'baseCommit' or change_row.patch_hash is distinct from p_data->>'patchHash'
        or change_row.verification->>'status' is distinct from 'passed' or change_row.review_summary is null
        or (change_row.verification->>'baselineFailed')::boolean is distinct from true or (change_row.verification->>'candidatePassed')::boolean is distinct from true
        or change_row.verification->>'baseCommit' is distinct from change_row.base_commit or change_row.verification->>'patchHash' is distinct from change_row.patch_hash
        then raise exception 'Approval requires current passing tests and independent review' using errcode='PT409'; end if;
      update public.review_changes set status='approved',approval=jsonb_build_object('userId',actor,'evidenceVersion',evidence_version,'baseCommit',base_commit,'patchHash',patch_hash,'createdAt',now()),updated_at=now()
      where id=change_row.id returning * into change_row;
      subject:=change_row.id; result:=to_jsonb(change_row);
    elsif p_action='reserveJob' then
      select * into job from public.review_jobs where organization_id=p_org and idempotency_key=p_data->>'idempotencyKey';
      if found then
        if job.change_id is distinct from (p_data->>'changeId')::uuid or job.stage is distinct from p_data->>'stage' then raise exception 'Idempotency key is already used' using errcode='PT409'; end if;
        return to_jsonb(job);
      end if;
      if (select count(*) from public.review_jobs where organization_id=p_org and created_at>now()-interval '24 hours')>=20
        or (select count(*) from public.review_jobs where created_at>now()-interval '24 hours')>=100
        or (select count(*) from public.review_jobs where organization_id=p_org and status in ('queued','running','waiting'))>=2
        or (select count(*) from public.review_jobs where status in ('queued','running','waiting'))>=4 then
        raise exception 'Job rate or active-work limit reached' using errcode='P0001';
      end if;
      select * into change_row from public.review_changes where organization_id=p_org and id=(p_data->>'changeId')::uuid for update;
      if not found then raise exception 'Change unavailable' using errcode='P0002'; end if;
      if change_row.status in ('published','cancelled') then raise exception 'Change is closed' using errcode='PT409'; end if;
      if p_data->>'stage'<>'investigate' and change_row.evidence_version is distinct from (select evidence_version from public.review_laptops where id=change_row.laptop_id) then raise exception 'Investigate the latest evidence first' using errcode='PT409'; end if;
      if p_data->>'stage'='investigate' then
        update public.review_changes set evidence_version=(select evidence_version from public.review_laptops where id=change_row.laptop_id),investigation=null,verification=null,approval=null,base_commit=null,patch_hash=null,patch=null,review_summary=null where id=change_row.id returning * into change_row;
        delete from review_private.change_artifacts where change_id=change_row.id;
      end if;
      if (p_data->>'stage'='patch' and (change_row.investigation->>'classification' is distinct from 'software' or change_row.project_id is null))
        or (p_data->>'stage'='verify' and (change_row.patch is null or change_row.base_commit is null or change_row.patch_hash is null))
        or (p_data->>'stage'='review' and change_row.verification->>'status' is distinct from 'passed')
        or (p_data->>'stage'='publish' and (change_row.status<>'approved' or change_row.approval is null))
        then raise exception 'Prerequisite stage is incomplete' using errcode='PT409'; end if;
      amount:=(p_data->>'reservedCents')::integer;
      if amount is null or amount<0 or amount>100 then raise exception 'Invalid reservation' using errcode='22023'; end if;
      insert into public.review_budgets(organization_id,period) values(p_org,current_period) on conflict do nothing;
      select * into budget from public.review_budgets where organization_id=p_org and period=current_period for update;
      if budget.spent_cents+budget.reserved_cents+amount>org.monthly_budget_cents or runtime.spent_cents+runtime.reserved_cents+amount>runtime.budget_limit_cents then raise exception 'Budget exhausted' using errcode='P0001'; end if;
      update public.review_budgets set reserved_cents=reserved_cents+amount where organization_id=p_org and period=current_period;
      update review_private.runtime set reserved_cents=reserved_cents+amount where singleton=true;
      insert into public.review_jobs(organization_id,change_id,stage,created_by,reserved_cents,budget_period,idempotency_key,evidence_version)
      values(p_org,change_row.id,p_data->>'stage',actor,amount,current_period,p_data->>'idempotencyKey',change_row.evidence_version) returning * into job;
      insert into review_private.job_checkpoints(job_id,checkpoint) values(job.id,coalesce((select a.checkpoint from review_private.change_artifacts a where a.change_id=change_row.id),'{}'));
      if job.stage<>'publish' then
        update public.review_changes set approval=null,status=case when job.stage='investigate' then 'investigating' when job.stage='verify' then 'testing' else status end,updated_at=now() where id=change_row.id;
      end if;
      subject:=job.id; result:=to_jsonb(job);
    elsif p_action in ('claimJob','completeJob','cancelJob','saveCheckpoint') then
      select * into job from public.review_jobs where organization_id=p_org and id=(p_data->>'jobId')::uuid for update;
      if not found then raise exception 'Job unavailable' using errcode='P0002'; end if;
      select * into checkpoint from review_private.job_checkpoints where job_id=job.id for update;
      if p_action='saveCheckpoint' then
        if job.status<>'running' or checkpoint.lease_token is null or checkpoint.lease_token is distinct from (p_data->>'leaseToken')::uuid or checkpoint.lease_until<=now() then raise exception 'Worker lease is stale' using errcode='PT409'; end if;
        if jsonb_typeof(p_data->'checkpoint') is distinct from 'object' or octet_length((p_data->'checkpoint')::text)>500000 then raise exception 'Invalid checkpoint' using errcode='22023'; end if;
        update review_private.job_checkpoints set checkpoint=p_data->'checkpoint' where job_id=job.id;
      elsif p_action='claimJob' then
        if job.status not in ('queued','waiting','running') or (checkpoint.lease_until>now() and checkpoint.lease_token is not null) then raise exception 'Job is closed or already running' using errcode='PT409'; end if;
        update review_private.job_checkpoints set lease_token=gen_random_uuid(),lease_until=now()+interval '75 seconds' where job_id=job.id returning * into checkpoint;
        update public.review_jobs set status='running',updated_at=now(),message='Working in an isolated stage' where id=job.id returning * into job;
        return jsonb_build_object('job',to_jsonb(job),'checkpoint',checkpoint.checkpoint,'leaseToken',checkpoint.lease_token);
      elsif p_action='cancelJob' then
        if job.status in ('completed','failed','cancelled') then return to_jsonb(job); end if;
        -- Do not free credits still in use by an active external operation.
        if job.status<>'running' then
          update public.review_budgets set reserved_cents=reserved_cents-job.reserved_cents where organization_id=p_org and period=job.budget_period;
          update review_private.runtime set reserved_cents=reserved_cents-job.reserved_cents where singleton=true;
          job.reserved_cents:=0;
        end if;
        update public.review_jobs set status='cancelled',reserved_cents=job.reserved_cents,message='Cancellation requested',updated_at=now() where id=job.id returning * into job;
        update public.review_changes set status='cancelled',approval=null,updated_at=now() where id=job.change_id;
      else
        if job.status not in ('running','cancelled') or checkpoint.lease_token is null or checkpoint.lease_token is distinct from (p_data->>'leaseToken')::uuid then raise exception 'Worker lease is stale' using errcode='PT409'; end if;
        charge:=(p_data->>'spentCents')::integer;
        final_status:=p_data->>'status';
        if charge is null or charge<0 or charge>job.reserved_cents or final_status not in ('waiting','completed','failed') then raise exception 'Invalid worker result' using errcode='22023'; end if;
        select * into change_row from public.review_changes where id=job.change_id for update;
        if change_row.evidence_version<>job.evidence_version or job.evidence_version<>(select evidence_version from public.review_laptops where id=change_row.laptop_id) then final_status:='failed'; end if;
        if job.status='cancelled' then final_status:='cancelled'; end if;
        amount:=case when final_status='waiting' then charge else job.reserved_cents end;
        update public.review_budgets set reserved_cents=reserved_cents-amount,spent_cents=spent_cents+charge where organization_id=p_org and period=job.budget_period;
        update review_private.runtime set reserved_cents=reserved_cents-amount,spent_cents=spent_cents+charge where singleton=true;
        update public.review_jobs set status=final_status,reserved_cents=reserved_cents-amount,message=left(coalesce(p_data->>'message','Stage complete'),500),updated_at=now() where id=job.id returning * into job;
        update review_private.job_checkpoints set checkpoint=coalesce(p_data->'checkpoint',checkpoint.checkpoint),lease_token=null,lease_until=null where job_id=job.id;
        if change_row.evidence_version=job.evidence_version and job.evidence_version=(select evidence_version from public.review_laptops where id=change_row.laptop_id) and final_status in ('waiting','completed') then
          insert into review_private.change_artifacts(change_id,checkpoint) values(job.change_id,coalesce(p_data->'checkpoint',checkpoint.checkpoint)) on conflict(change_id) do update set checkpoint=excluded.checkpoint;
        end if;
        if change_row.evidence_version=job.evidence_version and job.evidence_version=(select evidence_version from public.review_laptops where id=change_row.laptop_id) and final_status<>'cancelled' and p_data->'change' is not null then
          update public.review_changes set
            status=coalesce(p_data->'change'->>'status',status),
            investigation=case when (p_data->'change')?'investigation' then p_data->'change'->'investigation' else investigation end,
            verification=case when (p_data->'change')?'verification' then p_data->'change'->'verification' else verification end,
            base_commit=case when (p_data->'change')?'baseCommit' then p_data->'change'->>'baseCommit' else base_commit end,
            patch_hash=case when (p_data->'change')?'patchHash' then p_data->'change'->>'patchHash' else patch_hash end,
            patch=case when (p_data->'change')?'patch' then p_data->'change'->>'patch' else patch end,
            review_summary=case when (p_data->'change')?'reviewSummary' then p_data->'change'->>'reviewSummary' else review_summary end,
            draft_pr_url=case when (p_data->'change')?'draftPrUrl' then p_data->'change'->>'draftPrUrl' else draft_pr_url end,
            updated_at=now()
          where id=job.change_id;
        end if;
      end if;
      subject:=job.id; result:=to_jsonb(job);
    else raise exception 'Unknown action' using errcode='22023'; end if;
  end if;
  insert into public.review_audit(organization_id,actor_id,action,subject_id,details)
  values(org_id,actor,p_action,subject,jsonb_build_object('trustedWorker',trusted));
  return result;
end $$;
