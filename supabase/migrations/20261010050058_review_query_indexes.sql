-- Evidence changes invalidate all requests for a laptop, including historical requests.
-- Laptop IDs lead because that write path looks up the globally unique ID directly.
create index review_changes_laptop_org
  on public.review_changes(laptop_id,organization_id);

-- Reconnection invalidates a project's requests and private artifacts. This also
-- supplies the join lookup used when checking whether that project has active jobs.
create index review_changes_project_org
  on public.review_changes(project_id,organization_id);

-- The aggregate 24-hour job quota has no organization predicate; the existing
-- organization/created_at index cannot efficiently bound this global time window.
create index review_jobs_created
  on public.review_jobs(created_at desc);

-- No duplicate evidence index: unique(laptop_id,version) already serves evidence
-- history reads. review_one_active_job already bounds active jobs by change.
-- Auth actor/creator and invite foreign keys are not current lookup paths.
