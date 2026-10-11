import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authenticateReviewRequest, createReviewFetch, reviewAuthConfig, ReviewAccessError } from '../lib/review/auth.js';
import { ReviewStore, ReviewStoreError } from '../lib/review/store.js';

const users = { owner:'11111111-1111-4111-8111-111111111111', reviewer:'22222222-2222-4222-8222-222222222222', outsider:'33333333-3333-4333-8333-333333333333', anonymous:'44444444-4444-4444-8444-444444444444' };
const secret = 'test-only-worker-proof-01234567890123456789';
let db: PGlite;
let primaryOrg: string;
let laptopId: string;
let changeId: string;

async function as(user: string, role='authenticated') {
  await db.exec(`reset role; set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
}
async function rpc(action: string, org: string | null, data: object, workerSecret: string | null = null): Promise<any> {
  const result = await db.query<{result:any}>('select public.review_mutate($1,$2::uuid,$3::jsonb,$4) as result',[action,org,JSON.stringify(data),workerSecret]);
  return result.rows[0].result;
}
async function raw(sql: string, params?: any[]) {
  await db.exec('reset role');
  return db.query(sql,params);
}

before(async()=>{
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key,is_anonymous boolean not null default false);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated;
    grant execute on function auth.uid() to authenticated;
    create function public.rls_auto_enable() returns event_trigger language plpgsql security definer as $$ begin end $$;
  `);
  const migrationDirectory=new URL('../supabase/migrations/',import.meta.url);
  for(const filename of readdirSync(migrationDirectory).filter(name=>name.endsWith('.sql')).sort()) await db.exec(readFileSync(new URL(filename,migrationDirectory),'utf8'));
  for (const [name,id] of Object.entries(users)) await db.query('insert into auth.users(id,is_anonymous) values($1,$2)',[id,name==='anonymous']);
  await db.query("update review_private.runtime set worker_secret_hash=encode(sha256(convert_to($1,'UTF8')),'hex')",[secret]);
  await as(users.owner);
  primaryOrg=(await rpc('createOrganization',null,{name:'Northstar Lab'})).id;
  laptopId=(await rpc('createLaptop',primaryOrg,{assetTag:'LAB-014',manufacturer:'Lenovo',model:'T480',operatingSystem:'Linux'})).id;
  await rpc('addEvidence',primaryOrg,{laptopId,kind:'diagnostic_log',content:'Parser reports impossible cycle count.',source:'Synthetic fixture'});
  changeId=(await rpc('createChange',primaryOrg,{laptopId,projectId:null,title:'Check battery parser',description:'Cycle count becomes negative in the diagnostics report.',modelTier:'lightning'})).id;
});
after(async()=>{ await db?.close(); });

test('actual PostgreSQL RLS isolates organizations and denies direct mutation',async()=>{
  await as(users.outsider);
  assert.equal((await db.query('select * from public.review_laptops')).rows.length,0);
  assert.equal((await db.query('select * from public.review_organizations')).rows.length,0);
  await assert.rejects(rpc('createLaptop',primaryOrg,{assetTag:'ATTACK',manufacturer:'X',model:'X',operatingSystem:'X'}),/Organization unavailable/);
  await as(users.owner);
  assert.equal((await db.query('select * from public.review_laptops')).rows.length,1);
  await assert.rejects(db.query("update public.review_laptops set organization_id=gen_random_uuid() where id=$1",[laptopId]),/permission denied/);
  await assert.rejects(db.query('select * from review_private.runtime'),/permission denied/);
  await assert.rejects(db.query('select * from review_private.job_checkpoints'),/permission denied/);
});

test('anonymous accounts cannot bootstrap tenants or read member rows',async()=>{
  await as(users.anonymous);
  await assert.rejects(rpc('createOrganization',null,{name:'Anonymous org'}),/Sign in required/);
  assert.equal((await db.query('select * from public.review_memberships')).rows.length,0);
  await as(users.owner,'anon');
  await assert.rejects(rpc('createOrganization',null,{name:'Unauthenticated'}),/permission denied/);
});

test('single-use expiring invites grant server-stored role and cannot elevate existing membership',async()=>{
  await as(users.owner);
  const invite=await rpc('createInvite',primaryOrg,{role:'reviewer'});
  assert.equal(invite.token.length,64);
  await as(users.reviewer);
  await rpc('redeemInvite',null,{token:invite.token});
  assert.equal((await db.query<{role:string}>('select role from public.review_memberships where user_id=$1',[users.reviewer])).rows[0].role,'reviewer');
  await assert.rejects(rpc('redeemInvite',null,{token:invite.token}),/expired or unavailable/);
  await assert.rejects(rpc('createInvite',primaryOrg,{role:'owner'}),/Administrator role required/);
  await as(users.owner);
  const expired=await rpc('createInvite',primaryOrg,{role:'viewer'});
  await raw("update review_private.invites set expires_at=now()-interval '1 minute' where token_hash=encode(sha256(convert_to($1,'UTF8')),'hex')",[expired.token]);
  await as(users.outsider);
  await assert.rejects(rpc('redeemInvite',null,{token:expired.token}),/expired or unavailable/);
});

test('viewer can read but cannot add evidence, change budget or approve',async()=>{
  await as(users.owner);
  const invite=await rpc('createInvite',primaryOrg,{role:'viewer'});
  await as(users.outsider); await rpc('redeemInvite',null,{token:invite.token});
  assert.equal((await db.query('select * from public.review_laptops')).rows.length,1);
  await assert.rejects(rpc('addEvidence',primaryOrg,{laptopId,kind:'technician_note',content:'Changed',source:'Viewer'}),/Write access required/);
  await assert.rejects(rpc('setBudget',primaryOrg,{monthlyBudgetCents:100}),/Administrator role required/);
  await assert.rejects(rpc('approveChange',primaryOrg,{changeId}),/Reviewer role required/);
});

test('cross-tenant foreign keys reject a linked laptop even for two-organization owner',async()=>{
  await as(users.owner);
  const second=(await rpc('createOrganization',null,{name:'Second lab'})).id;
  await assert.rejects(rpc('createChange',second,{laptopId,projectId:null,title:'Wrong laptop',description:'This is a laptop owned by another organization.',modelTier:'nano'}),/Laptop unavailable/);
});

test('worker proof is mandatory for test results, repo connections and reservations',async()=>{
  await as(users.owner);
  await assert.rejects(rpc('reserveJob',primaryOrg,{changeId,stage:'investigate',idempotencyKey:'missing-proof',reservedCents:3}),/Trusted worker required/);
  await assert.rejects(rpc('connectProject',primaryOrg,{repository:'example/repo'}),/Trusted worker required/);
  await assert.rejects(rpc('completeJob',primaryOrg,{jobId:changeId,status:'completed'}),/Trusted worker required/);
});

test('incomplete stage returns nonretryable PT409 and leaves jobs, audit and budgets untouched',async()=>{
  await as(users.owner);
  const snapshot=async()=>({
    jobs:(await db.query('select id,status,reserved_cents from public.review_jobs order by id')).rows,
    audits:(await db.query('select id from public.review_audit order by id')).rows,
    budgets:(await db.query('select organization_id,spent_cents,reserved_cents from public.review_budgets order by organization_id')).rows,
  });
  const before=await snapshot();
  for(const stage of ['patch','verify','review','publish']) {
    await assert.rejects(rpc('reserveJob',primaryOrg,{changeId,stage,idempotencyKey:`missing-prerequisite-${stage}`,reservedCents:1},secret),
      (error:any)=>error.code==='PT409' && error.message==='Prerequisite stage is incomplete');
  }
  assert.deepEqual(await snapshot(),before);
});

test('deployed mutation definition uses runtime then organization then child locks and no synthetic serialization failures',async()=>{
  const row=(await raw("select pg_get_functiondef('review_private.mutate(text,uuid,jsonb,text)'::regprocedure) as definition")).rows[0] as {definition:string};
  assert.doesNotMatch(row.definition,/errcode\s*=\s*'40001'/i);
  const runtime=row.definition.indexOf('where singleton=true for update');
  const organization=row.definition.indexOf('where id=p_org for no key update');
  const firstChild=row.definition.indexOf("where id=(p_data->>'laptopId')::uuid and organization_id=p_org for update");
  assert.ok(runtime>0 && runtime<organization && organization<firstChild);
  assert.equal(row.definition.match(/where singleton=true for update/g)?.length,1);
  assert.doesNotMatch(row.definition,/review_organizations[^;]+for update/i);
  await as(users.owner);
});

test('store maps nonretryable conflict to sanitized 409 without repeating the mutation',async()=>{
  let calls=0;
  const client={rpc:async()=>{calls++;return {data:null,error:{code:'PT409',message:'private database context'}};}} as unknown as SupabaseClient;
  await assert.rejects(new ReviewStore(client,users.owner).reserveJob(primaryOrg,changeId,'publish','blocked-publication',0,secret),
    (error:any)=>error instanceof ReviewStoreError && error.status===409 && error.code==='CONFLICT' && !error.message.includes('private database context'));
  assert.equal(calls,1);
});

test('job reservations are idempotent, exclusive and charged atomically',async()=>{
  await as(users.owner);
  const input={changeId,stage:'investigate',idempotencyKey:'reservation-001',reservedCents:5};
  const job=await rpc('reserveJob',primaryOrg,input,secret);
  const duplicate=await rpc('reserveJob',primaryOrg,input,secret);
  assert.equal(job.id,duplicate.id);
  await assert.rejects(rpc('reserveJob',primaryOrg,{...input,stage:'patch'},secret),/Idempotency key/);
  await assert.rejects(rpc('reserveJob',primaryOrg,{...input,idempotencyKey:'reservation-002'},secret),/duplicate key/);
  const claimed=await rpc('claimJob',primaryOrg,{jobId:job.id},secret);
  await assert.rejects(rpc('saveCheckpoint',primaryOrg,{jobId:job.id,leaseToken:claimed.leaseToken,checkpoint:{inflight:'model'}}),/Trusted worker required/);
  await assert.rejects(rpc('saveCheckpoint',primaryOrg,{jobId:job.id,leaseToken:users.owner,checkpoint:{inflight:'model'}},secret),/lease is stale/);
  await rpc('saveCheckpoint',primaryOrg,{jobId:job.id,leaseToken:claimed.leaseToken,checkpoint:{inflight:'model',privateInput:'restricted source'}},secret);
  const checkpoint=await raw('select checkpoint from review_private.job_checkpoints where job_id=$1',[job.id]);
  assert.equal((checkpoint.rows[0] as any).checkpoint.inflight,'model');
  await as(users.owner);
  await assert.rejects(rpc('claimJob',primaryOrg,{jobId:job.id},secret),/already running/);
  await assert.rejects(rpc('completeJob',primaryOrg,{jobId:job.id,leaseToken:users.owner,status:'completed',spentCents:1},secret),/lease is stale/);
  await assert.rejects(rpc('completeJob',primaryOrg,{jobId:job.id,leaseToken:claimed.leaseToken,status:'completed',spentCents:6},secret),/Invalid worker result/);
  await rpc('completeJob',primaryOrg,{jobId:job.id,leaseToken:claimed.leaseToken,status:'completed',spentCents:2,message:'Investigation complete',checkpoint:{privateArtifact:'source stays private'},change:{status:'hardware_review',investigation:{classification:'hardware',summary:'Inspect battery',findings:[],nextSteps:[],model:'verified-model'}}},secret);
  const budget=(await db.query<{spent_cents:number;reserved_cents:number}>('select * from public.review_budgets where organization_id=$1',[primaryOrg])).rows[0];
  assert.equal(budget.spent_cents,2); assert.equal(budget.reserved_cents,0);
  const view=await db.query('select * from public.review_jobs where id=$1',[job.id]);
  assert.equal(JSON.stringify(view.rows).includes('privateArtifact'),false);
});

test('new evidence freezes prior snapshot, invalidates approval and rejects in-flight completion',async()=>{
  await as(users.owner);
  const job=await rpc('reserveJob',primaryOrg,{changeId,stage:'investigate',idempotencyKey:'evidence-stage-1',reservedCents:5},secret);
  const claimed=await rpc('claimJob',primaryOrg,{jobId:job.id},secret);
  await rpc('addEvidence',primaryOrg,{laptopId,kind:'technician_note',content:'A newer physical observation.',source:'Test technician'});
  const before=(await db.query<any>('select * from public.review_changes where id=$1',[changeId])).rows[0];
  assert.equal(before.evidence_version,1); assert.equal(before.status,'needs_evidence');
  const result=await rpc('completeJob',primaryOrg,{jobId:job.id,leaseToken:claimed.leaseToken,status:'completed',spentCents:1,message:'Stale test',change:{status:'awaiting_approval',reviewSummary:'Would be unsafe'}},secret);
  assert.equal(result.status,'failed');
  const unchanged=(await db.query<any>('select * from public.review_changes where id=$1',[changeId])).rows[0];
  assert.equal(unchanged.review_summary,null); assert.equal(unchanged.status,'needs_evidence');
  const next=await rpc('reserveJob',primaryOrg,{changeId,stage:'investigate',idempotencyKey:'evidence-stage-2',reservedCents:1},secret);
  const nextClaim=await rpc('claimJob',primaryOrg,{jobId:next.id},secret);
  assert.deepEqual(nextClaim.checkpoint,{});
  assert.equal((await db.query<any>('select evidence_version from public.review_changes where id=$1',[changeId])).rows[0].evidence_version,2);
  await rpc('completeJob',primaryOrg,{jobId:next.id,leaseToken:nextClaim.leaseToken,status:'completed',spentCents:0,change:{status:'needs_evidence'}},secret);
});

test('failed external-call checkpoints stay private to the old job and do not poison a new reservation',async()=>{
  await as(users.owner);
  const project=await rpc('connectProject',primaryOrg,{repository:'fixture/diagnostics',repositoryId:17,installationId:21,defaultBranch:'main',targetPath:'src/diagnostics/parser.mjs',testPaths:['tests/diagnostics/parser.test.mjs']},secret);
  const change=await rpc('createChange',primaryOrg,{laptopId,projectId:project.id,title:'Checkpoint retry test',description:'A bounded software change for retry validation.',modelTier:'lightning'});
  const initial=await rpc('reserveJob',primaryOrg,{changeId:change.id,stage:'investigate',idempotencyKey:'retry-prerequisite',reservedCents:1},secret);
  const firstClaim=await rpc('claimJob',primaryOrg,{jobId:initial.id},secret);
  await rpc('completeJob',primaryOrg,{jobId:initial.id,leaseToken:firstClaim.leaseToken,status:'completed',spentCents:1,checkpoint:{lastGood:'investigation'},change:{status:'open',investigation:{classification:'software'}}},secret);
  const failed=await rpc('reserveJob',primaryOrg,{changeId:change.id,stage:'patch',idempotencyKey:'retry-failed-first',reservedCents:2},secret);
  const failedClaim=await rpc('claimJob',primaryOrg,{jobId:failed.id},secret);
  await rpc('saveCheckpoint',primaryOrg,{jobId:failed.id,leaseToken:failedClaim.leaseToken,checkpoint:{lastGood:'investigation',inFlight:'nebius-patch'}},secret);
  await rpc('completeJob',primaryOrg,{jobId:failed.id,leaseToken:failedClaim.leaseToken,status:'failed',spentCents:2,checkpoint:{lastGood:'investigation',inFlight:'nebius-patch'},change:{status:'failed'}},secret);
  const uncertain=await raw('select checkpoint from review_private.job_checkpoints where job_id=$1',[failed.id]);
  assert.equal((uncertain.rows[0] as any).checkpoint.inFlight,'nebius-patch');
  await as(users.owner);
  const retried=await rpc('reserveJob',primaryOrg,{changeId:change.id,stage:'patch',idempotencyKey:'retry-new-reservation',reservedCents:2},secret);
  const retryClaim=await rpc('claimJob',primaryOrg,{jobId:retried.id},secret);
  assert.deepEqual(retryClaim.checkpoint,{lastGood:'investigation'});
  await rpc('completeJob',primaryOrg,{jobId:retried.id,leaseToken:retryClaim.leaseToken,status:'failed',spentCents:0,change:{status:'failed'}},secret);
});

test('approvals require a different reviewer, exact hashes and current evidence',async()=>{
  const commit='a'.repeat(40), patch='b'.repeat(64);
  await raw("update public.review_changes set status='awaiting_approval',base_commit=$2,patch_hash=$3,review_summary='Independent model reviewed',verification=$4::jsonb where id=$1",[changeId,commit,patch,JSON.stringify({status:'passed',baselineFailed:true,candidatePassed:true,baseCommit:commit,patchHash:patch})]);
  await as(users.owner);
  await assert.rejects(rpc('approveChange',primaryOrg,{changeId,evidenceVersion:2,baseCommit:commit,patchHash:patch}),/different person/);
  await as(users.reviewer);
  await assert.rejects(rpc('approveChange',primaryOrg,{changeId,evidenceVersion:2,baseCommit:commit,patchHash:'c'.repeat(64)}),/current passing tests/);
  const approved=await rpc('approveChange',primaryOrg,{changeId,evidenceVersion:2,baseCommit:commit,patchHash:patch});
  assert.equal(approved.status,'approved'); assert.equal(approved.approval.userId,users.reviewer);
  await as(users.owner);
  await rpc('addEvidence',primaryOrg,{laptopId,kind:'diagnostic_log',content:'Observation after approval.',source:'Synthetic fixture'});
  const invalidated=(await db.query<any>('select * from public.review_changes where id=$1',[changeId])).rows[0];
  assert.equal(invalidated.approval,null); assert.equal(invalidated.verification,null);
  await assert.rejects(rpc('reserveJob',primaryOrg,{changeId,stage:'publish',idempotencyKey:'publish-stale-1',reservedCents:0},secret),/latest evidence/);
});

test('global credit ceiling is shared by organizations and cannot be raised through setBudget',async()=>{
  await as(users.owner);
  await assert.rejects(rpc('setBudget',primaryOrg,{monthlyBudgetCents:101}),/service ceiling/);
  await rpc('setBudget',primaryOrg,{monthlyBudgetCents:100});
  await raw('update review_private.runtime set budget_limit_cents=spent_cents+1');
  await as(users.owner);
  await assert.rejects(rpc('reserveJob',primaryOrg,{changeId,stage:'investigate',idempotencyKey:'global-budget-1',reservedCents:2},secret),/Budget exhausted/);
  assert.equal((await db.query<any>('select sum(reserved_cents)::int as total from public.review_budgets')).rows[0].total,0);
  await raw('update review_private.runtime set budget_limit_cents=100');
});

test('active cancellation retains costs until worker settlement and prevents results applying',async()=>{
  await as(users.owner);
  const job=await rpc('reserveJob',primaryOrg,{changeId,stage:'investigate',idempotencyKey:'cancel-active-1',reservedCents:4},secret);
  const claim=await rpc('claimJob',primaryOrg,{jobId:job.id},secret);
  const cancelled=await rpc('cancelJob',primaryOrg,{jobId:job.id});
  assert.equal(cancelled.reserved_cents,4);
  const completed=await rpc('completeJob',primaryOrg,{jobId:job.id,leaseToken:claim.leaseToken,status:'completed',spentCents:1,change:{status:'awaiting_approval'}},secret);
  assert.equal(completed.status,'cancelled'); assert.equal(completed.reserved_cents,0);
  assert.equal((await db.query<any>('select status from public.review_changes where id=$1',[changeId])).rows[0].status,'cancelled');
});

test('competing organizations share one reservation ceiling and organization creation is capped',async()=>{
  await as(users.owner);
  const otherOrg=(await rpc('createOrganization',null,{name:'Third lab'})).id;
  await assert.rejects(rpc('createOrganization',null,{name:'Fourth lab'}),/Organization limit/);
  const otherLaptop=(await rpc('createLaptop',otherOrg,{assetTag:'OTHER-1',manufacturer:'Dell',model:'Latitude',operatingSystem:'Linux'})).id;
  const firstChange=(await rpc('createChange',primaryOrg,{laptopId,projectId:null,title:'New independent work',description:'Investigate a separate observed issue.',modelTier:'nano'})).id;
  const secondChange=(await rpc('createChange',otherOrg,{laptopId:otherLaptop,projectId:null,title:'Second organization work',description:'Investigate a separate observed issue.',modelTier:'nano'})).id;
  await raw('update review_private.runtime set budget_limit_cents=spent_cents+4');
  await as(users.owner);
  const attempts=await Promise.allSettled([
    rpc('reserveJob',primaryOrg,{changeId:firstChange,stage:'investigate',idempotencyKey:'competing-org-1',reservedCents:3},secret),
    rpc('reserveJob',otherOrg,{changeId:secondChange,stage:'investigate',idempotencyKey:'competing-org-2',reservedCents:3},secret),
  ]);
  assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(attempts.filter(r=>r.status==='rejected').length,1);
  for (const attempt of attempts) if (attempt.status==='fulfilled') await rpc('cancelJob',attempt.value.organization_id,{jobId:attempt.value.id});
  assert.equal((await db.query<any>('select sum(reserved_cents)::int as total from public.review_budgets')).rows[0].total,0);
  await raw('update review_private.runtime set budget_limit_cents=100');
});

test('zero-cost stages remain subject to organization and service job rate limits',async()=>{
  await as(users.owner);
  const change=(await rpc('createChange',primaryOrg,{laptopId,projectId:null,title:'Quota boundary test',description:'An independent request for quota checks.',modelTier:'nano'})).id;
  await raw(`insert into public.review_jobs(organization_id,change_id,stage,status,created_by,reserved_cents,budget_period,idempotency_key,evidence_version)
    select $1::uuid,$2::uuid,'investigate','completed',$3::uuid,0,date_trunc('month',now())::date,'quota-seed-'||i,3 from generate_series(1,100) i`,[primaryOrg,change,users.owner]);
  await as(users.owner);
  await assert.rejects(rpc('reserveJob',primaryOrg,{changeId:change,stage:'investigate',idempotencyKey:'org-zero-cost-limit',reservedCents:0},secret),/Job rate or active-work limit/);
  const other=(await db.query<any>('select id from public.review_organizations where id<>$1 limit 1',[primaryOrg])).rows[0].id;
  const otherLaptop=(await rpc('createLaptop',other,{assetTag:'QUOTA-DEVICE',manufacturer:'Lenovo',model:'X1',operatingSystem:'Linux'})).id;
  const otherChange=(await rpc('createChange',other,{laptopId:otherLaptop,projectId:null,title:'Global quota boundary',description:'Global quota applies across organizations.',modelTier:'nano'})).id;
  await assert.rejects(rpc('reserveJob',other,{changeId:otherChange,stage:'investigate',idempotencyKey:'global-zero-cost-limit',reservedCents:0},secret),/Job rate or active-work limit/);
  await raw("delete from public.review_jobs where idempotency_key like 'quota-seed-%'");
  await as(users.owner);
});

test('audit and evidence are immutable even through accidental privileged updates',async()=>{
  await as(users.owner);
  const audit=(await db.query<any>('select * from public.review_audit limit 1')).rows[0];
  await assert.rejects(db.query('delete from public.review_audit where id=$1',[audit.id]),/permission denied/);
  await db.exec('reset role');
  await assert.rejects(db.query("update public.review_audit set action='changed' where id=$1",[audit.id]),/Immutable history/);
  await assert.rejects(db.query("update public.review_evidence set content='rewritten' where laptop_id=$1",[laptopId]),/Immutable history/);
});

test('automatic RLS event trigger is not executable by exposed API roles',async()=>{
  const result=await raw("select has_function_privilege('anon','public.rls_auto_enable()','execute') as anon, has_function_privilege('authenticated','public.rls_auto_enable()','execute') as authenticated");
  assert.deepEqual(result.rows[0],{anon:false,authenticated:false});
});

test('invalidation and global quota predicates have usable bounded index paths',async()=>{
  await db.exec('reset role; set enable_seqscan=off;');
  try {
    const laptop=await db.query('explain (format json) select id from public.review_changes where laptop_id=$1',[laptopId]);
    assert.match(JSON.stringify(laptop.rows),/review_changes_laptop_org/);
    const project=await db.query('explain (format json) select id from public.review_changes where project_id=$1',[users.owner]);
    assert.match(JSON.stringify(project.rows),/review_changes_project_org/);
    const quota=await db.query("explain (format json) select count(*) from public.review_jobs where created_at>now()-interval '24 hours'");
    assert.match(JSON.stringify(quota.rows),/review_jobs_created/);
    // Existing uniqueness already supplies the ordered, bounded evidence lookup.
    const evidence=await db.query('explain (format json) select * from public.review_evidence where laptop_id=$1 and version<=3 order by version desc limit 50',[laptopId]);
    assert.match(JSON.stringify(evidence.rows),/review_evidence_laptop_id_version_key/);
  } finally { await db.exec('reset enable_seqscan;'); }
});

test('auth config rejects accidentally exposed secret/service credentials',()=>{
  const url='https://example.supabase.co';
  assert.equal(reviewAuthConfig({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:'sb_secret_do-not-expose'}),null);
  const service=`a.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.c`;
  assert.equal(reviewAuthConfig({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:service}),null);
  assert.equal(reviewAuthConfig({SUPABASE_URL:'http://insecure.test',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_public'}),null);
});

test('server authentication calls getUser and never authorizes from metadata',async()=>{
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_public'};
  const token='valid-looking-user-token-1234567890';
  let checked=''; let header='';
  const factory=((_url: string,_key: string,options: any)=>{
    header=options.global.headers.Authorization;
    assert.equal(options.db.retry,false);
    assert.equal(typeof options.global.fetch,'function');
    return {auth:{getUser:async(jwt:string)=>{checked=jwt;return {data:{user:{id:users.owner,email:'review@example.test',is_anonymous:false,user_metadata:{role:'owner'}}},error:null};}}} as unknown as SupabaseClient;
  }) as typeof createClient;
  const result=await authenticateReviewRequest(`Bearer ${token}`,env,factory);
  assert.equal(checked,token); assert.equal(header,`Bearer ${token}`); assert.equal(result.userId,users.owner);
  await assert.rejects(authenticateReviewRequest('Basic abc',env,factory),(e:any)=>e instanceof ReviewAccessError && e.status===401);
});

test('real auth client bounds a stalled response body and reports a sanitized service outage',async()=>{
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_public'};
  let calls=0; let aborted=false;
  const transport:typeof fetch=async (_input,init)=>{
    calls++;
    return new Response(new ReadableStream({start(controller){
      controller.enqueue(new TextEncoder().encode('{"id":'));
      init!.signal!.addEventListener('abort',()=>{aborted=true;controller.error(init!.signal!.reason);},{once:true});
    }}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const started=Date.now();
  await assert.rejects(authenticateReviewRequest('Bearer valid-looking-user-token-1234567890',env,createClient,{fetch:transport,timeoutMs:25}),
    (e:any)=>e instanceof ReviewAccessError && e.status===503 && e.code==='AUTH_UNAVAILABLE' && !e.message.includes('token'));
  assert.equal(calls,1); assert.equal(aborted,true); assert.ok(Date.now()-started<1000);
});

test('Google authentication validates the user but never grants membership from provider metadata',async()=>{
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_public'};
  const requests:string[]=[];
  const transport:typeof fetch=async(input,init)=>{
    requests.push(`${init?.method ?? 'GET'} ${String(input)}`);
    if(String(input).includes('/auth/v1/user')) return Response.json({id:users.outsider,email:'person@gmail.com',is_anonymous:false,app_metadata:{provider:'google'},user_metadata:{role:'owner',organization_id:primaryOrg}});
    return Response.json([]);
  };
  const auth=await authenticateReviewRequest('Bearer valid-looking-user-token-1234567890',env,createClient,{fetch:transport});
  assert.equal(auth.userId,users.outsider);
  assert.equal('role' in auth,false);
  assert.deepEqual(await new ReviewStore(auth.client,auth.userId).listOrganizations(),[]);
  assert.equal(requests.length,2);
  assert.ok(requests.every(request=>request.startsWith('GET ')));
});

test('database requests share the bounded transport and do not retry transient errors',async()=>{
  const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_public'};
  let databaseCalls=0;
  const transport:typeof fetch=async input=>{
    if(String(input).includes('/auth/v1/user')) return Response.json({id:users.owner,email:'review@example.test',is_anonymous:false});
    databaseCalls++;
    return Response.json({code:'XX000',message:'private upstream detail'},{status:503,headers:{'Retry-After':'60'}});
  };
  const auth=await authenticateReviewRequest('Bearer valid-looking-user-token-1234567890',env,createClient,{fetch:transport,timeoutMs:25});
  await assert.rejects(new ReviewStore(auth.client,auth.userId).listOrganizations(),
    (e:any)=>e instanceof ReviewStoreError && e.status===503 && !e.message.includes('private upstream'));
  assert.equal(databaseCalls,1);
});

test('bounded fetch preserves request and explicit abort signals, including stalled headers',async()=>{
  let calls=0; let aborted=false;
  const transport:typeof fetch=(_input,init)=>{
    calls++;
    return new Promise((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>{aborted=true;reject(init!.signal!.reason);},{once:true}));
  };
  await assert.rejects(createReviewFetch(transport,15)('https://example.supabase.co/rest/v1/review_jobs'),(e:any)=>e.name==='TimeoutError');
  assert.equal(aborted,true); assert.equal(calls,1);
  for(const origin of ['request','init'] as const){
    const parent=new AbortController();
    const reason=new DOMException('Caller cancelled.','AbortError');
    const request=new Request('https://example.supabase.co/rest/v1/review_jobs',origin==='request'?{signal:parent.signal}:{});
    const pending=createReviewFetch(transport,500)(request,origin==='init'?{signal:parent.signal}:{});
    parent.abort(reason);
    await assert.rejects(pending,(e:any)=>e===reason);
  }
  assert.equal(calls,3);
});

test('store database errors do not leak provider details or secrets',async()=>{
  const fake={rpc:async()=>({data:null,error:{code:'XX000',message:'secret-database-detail'}})} as unknown as SupabaseClient;
  await assert.rejects(new ReviewStore(fake,users.owner).createLaptop(primaryOrg,{assetTag:'A',manufacturer:'X',model:'M',operatingSystem:'L'}),(e:any)=>e instanceof ReviewStoreError && e.status===503 && !e.message.includes('secret-database-detail'));
});
