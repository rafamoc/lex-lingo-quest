alter table "public"."daily_progress" disable row level security;

alter table "public"."module_progress" disable row level security;

alter table "public"."profiles" disable row level security;

alter table "public"."theory_sections" add column "audio_id" integer;

alter table "public"."theory_sections" add column "avatar_id" integer;

alter table "public"."topic_progress" disable row level security;


