-- REVIEW ONLY / NOT EXECUTED. Approval required even for this catalog SQL.
-- Metadata only: does not select member/contact/authentication row values.
begin read only;
set local statement_timeout = '10s';
set local lock_timeout = '2s';

-- Include tables AND views. A missing entry in list_tables is not proof of absence.
select n.nspname as schema_name,c.relname,c.relkind,c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relname in('published_courses','member_profiles','member_administrators',
  'member_account_audit_logs','courses','course_weeks','offerings',
  'edulab_admins','edulab_inquiries','edulab_inquiry_history')
order by n.nspname,c.relname;

select n.nspname as schema_name,c.relname,pg_get_viewdef(c.oid,true) as definition
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relname='published_courses' and c.relkind in('v','m');

select table_schema,table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_name in('published_courses','member_profiles','member_administrators')
order by table_schema,table_name,ordinal_position;

select grantee,table_schema,table_name,privilege_type
from information_schema.table_privileges
where table_name in('published_courses','member_profiles','member_administrators')
order by table_schema,table_name,grantee,privilege_type;

select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies
where tablename in('member_profiles','member_administrators','courses','offerings')
order by schemaname,tablename,policyname;

select evtname,evtevent,evtenabled,evtfoid::regprocedure as handler
from pg_event_trigger order by evtname;

select n.nspname as schema_name,p.proname,pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where p.proname like 'edulab\_%' escape '\';

select n.nspname as schema_name,d.defaclrole::regrole as owner,
  d.defaclobjtype,d.defaclacl
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace
where n.nspname='public' or d.defaclnamespace=0;

rollback;
