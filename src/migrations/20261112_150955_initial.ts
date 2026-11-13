import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('pl', 'en');
  CREATE TYPE "public"."enum_operators_transport_modes" AS ENUM('tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry');
  CREATE TYPE "public"."enum_operators_purchase_methods_type" AS ENUM('machine', 'app', 'office', 'contactless', 'driver', 'sms', 'other');
  CREATE TYPE "public"."enum_operators_tickets_transport_modes" AS ENUM('tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry');
  CREATE TYPE "public"."enum_operators_tickets_category" AS ENUM('single', 'short', 'long', 'other');
  CREATE TYPE "public"."enum_operators_luggage_transport_modes" AS ENUM('tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry');
  CREATE TYPE "public"."enum_operators_related_operators_relation" AS ENUM('neighbourCity', 'sharedArea', 'regional', 'private');
  CREATE TYPE "public"."enum_operators_related_operators_ticket_validity" AS ENUM('valid', 'partial', 'invalid');
  CREATE TYPE "public"."enum__operators_v_version_transport_modes" AS ENUM('tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry');
  CREATE TYPE "public"."enum__operators_v_version_purchase_methods_type" AS ENUM('machine', 'app', 'office', 'contactless', 'driver', 'sms', 'other');
  CREATE TYPE "public"."enum__operators_v_version_tickets_transport_modes" AS ENUM('tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry');
  CREATE TYPE "public"."enum__operators_v_version_tickets_category" AS ENUM('single', 'short', 'long', 'other');
  CREATE TYPE "public"."enum__operators_v_version_luggage_transport_modes" AS ENUM('tram', 'bus', 'metro', 'train', 'trolleybus', 'ferry');
  CREATE TYPE "public"."enum__operators_v_version_related_operators_relation" AS ENUM('neighbourCity', 'sharedArea', 'regional', 'private');
  CREATE TYPE "public"."enum__operators_v_version_related_operators_ticket_validity" AS ENUM('valid', 'partial', 'invalid');
  CREATE TYPE "public"."enum_tariff_syncs_status" AS ENUM('failed', 'unchanged_source', 'no_changes', 'applied', 'pending_review', 'approved', 'rejected', 'superseded');
  CREATE TYPE "public"."enum_tariff_syncs_failed_stage" AS ENUM('fetch', 'extract', 'llm', 'validate', 'compare', 'apply');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'syncTariffs');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'syncTariffs');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "operators_transport_modes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_operators_transport_modes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods_buy_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods_buy_steps_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods_validation_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods_validation_steps_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods_validation_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods_validation_photos_locales" (
  	"caption" varchar NOT NULL,
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_purchase_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_operators_purchase_methods_type" DEFAULT 'machine' NOT NULL,
  	"requires_validation" boolean DEFAULT true
  );
  
  CREATE TABLE "operators_purchase_methods_locales" (
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"no_validation_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_tickets_transport_modes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_operators_tickets_transport_modes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "operators_tickets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_operators_tickets_category" NOT NULL,
  	"price_normal" numeric,
  	"price_reduced" numeric
  );
  
  CREATE TABLE "operators_tickets_locales" (
  	"name" varchar NOT NULL,
  	"validity" varchar,
  	"scope" varchar,
  	"where_to_buy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_luggage_transport_modes" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_operators_luggage_transport_modes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "operators_luggage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fee" numeric
  );
  
  CREATE TABLE "operators_luggage_locales" (
  	"item" varchar NOT NULL,
  	"note" varchar,
  	"fee_text" varchar,
  	"conditions" varchar,
  	"where_to_buy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_zones_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "operators_zones_items_locales" (
  	"name" varchar,
  	"covers" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_related_operators" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"operator_id" integer NOT NULL,
  	"relation" "enum_operators_related_operators_relation" DEFAULT 'sharedArea' NOT NULL,
  	"ticket_validity" "enum_operators_related_operators_ticket_validity" DEFAULT 'invalid' NOT NULL
  );
  
  CREATE TABLE "operators_related_operators_locales" (
  	"note" varchar,
  	"coverage" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_sources_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "operators_sources_items_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "operators_tariff_sources_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"xpath" varchar
  );
  
  CREATE TABLE "operators" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"sample_data" boolean DEFAULT false,
  	"short_name" varchar,
  	"logo_id" integer,
  	"website_url" varchar,
  	"timetable_url" varchar,
  	"zone_count" numeric,
  	"currency" varchar DEFAULT 'PLN',
  	"hotline" varchar,
  	"verified_at" timestamp(3) with time zone,
  	"rules_url" varchar,
  	"zones_enabled" boolean DEFAULT false,
  	"zones_map_id" integer,
  	"sources_ai_assisted" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "operators_locales" (
  	"label" varchar,
  	"description" varchar,
  	"payment_info" varchar,
  	"service_point" varchar,
  	"rules_note" varchar,
  	"zones_note_title" varchar,
  	"zones_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "operators_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cities_id" integer
  );
  
  CREATE TABLE "_operators_v_version_transport_modes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__operators_v_version_transport_modes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_buy_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_buy_steps_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_validation_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_validation_steps_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_validation_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_validation_photos_locales" (
  	"caption" varchar NOT NULL,
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__operators_v_version_purchase_methods_type" DEFAULT 'machine' NOT NULL,
  	"requires_validation" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_purchase_methods_locales" (
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"no_validation_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_tickets_transport_modes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__operators_v_version_tickets_transport_modes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_tickets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum__operators_v_version_tickets_category" NOT NULL,
  	"price_normal" numeric,
  	"price_reduced" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_tickets_locales" (
  	"name" varchar NOT NULL,
  	"validity" varchar,
  	"scope" varchar,
  	"where_to_buy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_luggage_transport_modes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__operators_v_version_luggage_transport_modes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_luggage" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"fee" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_luggage_locales" (
  	"item" varchar NOT NULL,
  	"note" varchar,
  	"fee_text" varchar,
  	"conditions" varchar,
  	"where_to_buy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_zones_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_zones_items_locales" (
  	"name" varchar,
  	"covers" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_related_operators" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"operator_id" integer NOT NULL,
  	"relation" "enum__operators_v_version_related_operators_relation" DEFAULT 'sharedArea' NOT NULL,
  	"ticket_validity" "enum__operators_v_version_related_operators_ticket_validity" DEFAULT 'invalid' NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_related_operators_locales" (
  	"note" varchar,
  	"coverage" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_sources_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v_version_sources_items_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_version_tariff_sources_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"xpath" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_operators_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_sample_data" boolean DEFAULT false,
  	"version_short_name" varchar,
  	"version_logo_id" integer,
  	"version_website_url" varchar,
  	"version_timetable_url" varchar,
  	"version_zone_count" numeric,
  	"version_currency" varchar DEFAULT 'PLN',
  	"version_hotline" varchar,
  	"version_verified_at" timestamp(3) with time zone,
  	"version_rules_url" varchar,
  	"version_zones_enabled" boolean DEFAULT false,
  	"version_zones_map_id" integer,
  	"version_sources_ai_assisted" boolean DEFAULT true,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_operators_v_locales" (
  	"version_label" varchar,
  	"version_description" varchar,
  	"version_payment_info" varchar,
  	"version_service_point" varchar,
  	"version_rules_note" varchar,
  	"version_zones_note_title" varchar,
  	"version_zones_note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_operators_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cities_id" integer
  );
  
  CREATE TABLE "cities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"country_id" integer,
  	"region_id" integer,
  	"primary_operator_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cities_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "countries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "countries_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "regions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"country_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "regions_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tariff_syncs_review_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "tariff_syncs_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"text_hash" varchar,
  	"changed" boolean
  );
  
  CREATE TABLE "tariff_syncs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"operator_id" integer NOT NULL,
  	"status" "enum_tariff_syncs_status" NOT NULL,
  	"applied_version" varchar,
  	"changes" jsonb,
  	"failed_stage" "enum_tariff_syncs_failed_stage",
  	"error" varchar,
  	"proposed" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"operators_id" integer,
  	"cities_id" integer,
  	"countries_id" integer,
  	"regions_id" integer,
  	"tariff_syncs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_transport_modes" ADD CONSTRAINT "operators_transport_modes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_buy_steps" ADD CONSTRAINT "operators_purchase_methods_buy_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_buy_steps_locales" ADD CONSTRAINT "operators_purchase_methods_buy_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods_buy_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_validation_steps" ADD CONSTRAINT "operators_purchase_methods_validation_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_validation_steps_locales" ADD CONSTRAINT "operators_purchase_methods_validation_steps_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods_validation_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_validation_photos" ADD CONSTRAINT "operators_purchase_methods_validation_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_validation_photos" ADD CONSTRAINT "operators_purchase_methods_validation_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_validation_photos_locales" ADD CONSTRAINT "operators_purchase_methods_validation_photos_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods_validation_photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods" ADD CONSTRAINT "operators_purchase_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_purchase_methods_locales" ADD CONSTRAINT "operators_purchase_methods_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_tickets_transport_modes" ADD CONSTRAINT "operators_tickets_transport_modes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_tickets" ADD CONSTRAINT "operators_tickets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_tickets_locales" ADD CONSTRAINT "operators_tickets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_luggage_transport_modes" ADD CONSTRAINT "operators_luggage_transport_modes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators_luggage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_luggage" ADD CONSTRAINT "operators_luggage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_luggage_locales" ADD CONSTRAINT "operators_luggage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_luggage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_zones_items" ADD CONSTRAINT "operators_zones_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_zones_items_locales" ADD CONSTRAINT "operators_zones_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_zones_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_related_operators" ADD CONSTRAINT "operators_related_operators_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operators_related_operators" ADD CONSTRAINT "operators_related_operators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_related_operators_locales" ADD CONSTRAINT "operators_related_operators_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_related_operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_sources_items" ADD CONSTRAINT "operators_sources_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_sources_items_locales" ADD CONSTRAINT "operators_sources_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators_sources_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_tariff_sources_pages" ADD CONSTRAINT "operators_tariff_sources_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators" ADD CONSTRAINT "operators_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operators" ADD CONSTRAINT "operators_zones_map_id_media_id_fk" FOREIGN KEY ("zones_map_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "operators_locales" ADD CONSTRAINT "operators_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_rels" ADD CONSTRAINT "operators_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "operators_rels" ADD CONSTRAINT "operators_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_transport_modes" ADD CONSTRAINT "_operators_v_version_transport_modes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_buy_steps" ADD CONSTRAINT "_operators_v_version_purchase_methods_buy_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_buy_steps_locales" ADD CONSTRAINT "_operators_v_version_purchase_methods_buy_steps_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods_buy_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_validation_steps" ADD CONSTRAINT "_operators_v_version_purchase_methods_validation_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_validation_steps_locales" ADD CONSTRAINT "_operators_v_version_purchase_methods_validation_steps_lo_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods_validation_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_validation_photos" ADD CONSTRAINT "_operators_v_version_purchase_methods_validation_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_validation_photos" ADD CONSTRAINT "_operators_v_version_purchase_methods_validation_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_validation_photos_locales" ADD CONSTRAINT "_operators_v_version_purchase_methods_validation_photos_l_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods_validation_photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods" ADD CONSTRAINT "_operators_v_version_purchase_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_purchase_methods_locales" ADD CONSTRAINT "_operators_v_version_purchase_methods_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_purchase_methods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_tickets_transport_modes" ADD CONSTRAINT "_operators_v_version_tickets_transport_modes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_operators_v_version_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_tickets" ADD CONSTRAINT "_operators_v_version_tickets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_tickets_locales" ADD CONSTRAINT "_operators_v_version_tickets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_luggage_transport_modes" ADD CONSTRAINT "_operators_v_version_luggage_transport_modes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_operators_v_version_luggage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_luggage" ADD CONSTRAINT "_operators_v_version_luggage_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_luggage_locales" ADD CONSTRAINT "_operators_v_version_luggage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_luggage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_zones_items" ADD CONSTRAINT "_operators_v_version_zones_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_zones_items_locales" ADD CONSTRAINT "_operators_v_version_zones_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_zones_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_related_operators" ADD CONSTRAINT "_operators_v_version_related_operators_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operators_v_version_related_operators" ADD CONSTRAINT "_operators_v_version_related_operators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_related_operators_locales" ADD CONSTRAINT "_operators_v_version_related_operators_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_related_operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_sources_items" ADD CONSTRAINT "_operators_v_version_sources_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_sources_items_locales" ADD CONSTRAINT "_operators_v_version_sources_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v_version_sources_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_version_tariff_sources_pages" ADD CONSTRAINT "_operators_v_version_tariff_sources_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v" ADD CONSTRAINT "_operators_v_parent_id_operators_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operators_v" ADD CONSTRAINT "_operators_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operators_v" ADD CONSTRAINT "_operators_v_version_zones_map_id_media_id_fk" FOREIGN KEY ("version_zones_map_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_operators_v_locales" ADD CONSTRAINT "_operators_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_rels" ADD CONSTRAINT "_operators_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_operators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_operators_v_rels" ADD CONSTRAINT "_operators_v_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cities" ADD CONSTRAINT "cities_primary_operator_id_operators_id_fk" FOREIGN KEY ("primary_operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cities_locales" ADD CONSTRAINT "cities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "countries_locales" ADD CONSTRAINT "countries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regions_locales" ADD CONSTRAINT "regions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_syncs_review_reasons" ADD CONSTRAINT "tariff_syncs_review_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_syncs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_syncs_pages" ADD CONSTRAINT "tariff_syncs_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tariff_syncs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tariff_syncs" ADD CONSTRAINT "tariff_syncs_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_operators_fk" FOREIGN KEY ("operators_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cities_fk" FOREIGN KEY ("cities_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_countries_fk" FOREIGN KEY ("countries_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regions_fk" FOREIGN KEY ("regions_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tariff_syncs_fk" FOREIGN KEY ("tariff_syncs_id") REFERENCES "public"."tariff_syncs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "operators_transport_modes_order_idx" ON "operators_transport_modes" USING btree ("order");
  CREATE INDEX "operators_transport_modes_parent_idx" ON "operators_transport_modes" USING btree ("parent_id");
  CREATE INDEX "operators_purchase_methods_buy_steps_order_idx" ON "operators_purchase_methods_buy_steps" USING btree ("_order");
  CREATE INDEX "operators_purchase_methods_buy_steps_parent_id_idx" ON "operators_purchase_methods_buy_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_purchase_methods_buy_steps_locales_locale_parent_i" ON "operators_purchase_methods_buy_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_purchase_methods_buy_steps_locales_parent_id_idx" ON "operators_purchase_methods_buy_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_purchase_methods_validation_steps_order_idx" ON "operators_purchase_methods_validation_steps" USING btree ("_order");
  CREATE INDEX "operators_purchase_methods_validation_steps_parent_id_idx" ON "operators_purchase_methods_validation_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_purchase_methods_validation_steps_locales_locale_p" ON "operators_purchase_methods_validation_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_purchase_methods_validation_steps_locales_pare_idx" ON "operators_purchase_methods_validation_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_purchase_methods_validation_photos_order_idx" ON "operators_purchase_methods_validation_photos" USING btree ("_order");
  CREATE INDEX "operators_purchase_methods_validation_photos_parent_id_idx" ON "operators_purchase_methods_validation_photos" USING btree ("_parent_id");
  CREATE INDEX "operators_purchase_methods_validation_photos_image_idx" ON "operators_purchase_methods_validation_photos" USING btree ("image_id");
  CREATE UNIQUE INDEX "operators_purchase_methods_validation_photos_locales_locale_" ON "operators_purchase_methods_validation_photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_purchase_methods_validation_photos_locales_par_idx" ON "operators_purchase_methods_validation_photos_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_purchase_methods_order_idx" ON "operators_purchase_methods" USING btree ("_order");
  CREATE INDEX "operators_purchase_methods_parent_id_idx" ON "operators_purchase_methods" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_purchase_methods_locales_locale_parent_id_unique" ON "operators_purchase_methods_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_purchase_methods_locales_parent_id_idx" ON "operators_purchase_methods_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_tickets_transport_modes_order_idx" ON "operators_tickets_transport_modes" USING btree ("order");
  CREATE INDEX "operators_tickets_transport_modes_parent_idx" ON "operators_tickets_transport_modes" USING btree ("parent_id");
  CREATE INDEX "operators_tickets_order_idx" ON "operators_tickets" USING btree ("_order");
  CREATE INDEX "operators_tickets_parent_id_idx" ON "operators_tickets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_tickets_locales_locale_parent_id_unique" ON "operators_tickets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_tickets_locales_parent_id_idx" ON "operators_tickets_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_luggage_transport_modes_order_idx" ON "operators_luggage_transport_modes" USING btree ("order");
  CREATE INDEX "operators_luggage_transport_modes_parent_idx" ON "operators_luggage_transport_modes" USING btree ("parent_id");
  CREATE INDEX "operators_luggage_order_idx" ON "operators_luggage" USING btree ("_order");
  CREATE INDEX "operators_luggage_parent_id_idx" ON "operators_luggage" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_luggage_locales_locale_parent_id_unique" ON "operators_luggage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_luggage_locales_parent_id_idx" ON "operators_luggage_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_zones_items_order_idx" ON "operators_zones_items" USING btree ("_order");
  CREATE INDEX "operators_zones_items_parent_id_idx" ON "operators_zones_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_zones_items_locales_locale_parent_id_unique" ON "operators_zones_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_zones_items_locales_parent_id_idx" ON "operators_zones_items_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_related_operators_order_idx" ON "operators_related_operators" USING btree ("_order");
  CREATE INDEX "operators_related_operators_parent_id_idx" ON "operators_related_operators" USING btree ("_parent_id");
  CREATE INDEX "operators_related_operators_operator_idx" ON "operators_related_operators" USING btree ("operator_id");
  CREATE UNIQUE INDEX "operators_related_operators_locales_locale_parent_id_unique" ON "operators_related_operators_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_related_operators_locales_parent_id_idx" ON "operators_related_operators_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_sources_items_order_idx" ON "operators_sources_items" USING btree ("_order");
  CREATE INDEX "operators_sources_items_parent_id_idx" ON "operators_sources_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_sources_items_locales_locale_parent_id_unique" ON "operators_sources_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_sources_items_locales_parent_id_idx" ON "operators_sources_items_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_tariff_sources_pages_order_idx" ON "operators_tariff_sources_pages" USING btree ("_order");
  CREATE INDEX "operators_tariff_sources_pages_parent_id_idx" ON "operators_tariff_sources_pages" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "operators_slug_idx" ON "operators" USING btree ("slug");
  CREATE INDEX "operators_logo_idx" ON "operators" USING btree ("logo_id");
  CREATE INDEX "operators_zones_zones_map_idx" ON "operators" USING btree ("zones_map_id");
  CREATE INDEX "operators_updated_at_idx" ON "operators" USING btree ("updated_at");
  CREATE INDEX "operators_created_at_idx" ON "operators" USING btree ("created_at");
  CREATE UNIQUE INDEX "operators_locales_locale_parent_id_unique" ON "operators_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "operators_locales_parent_id_idx" ON "operators_locales" USING btree ("_parent_id");
  CREATE INDEX "operators_rels_order_idx" ON "operators_rels" USING btree ("order");
  CREATE INDEX "operators_rels_parent_idx" ON "operators_rels" USING btree ("parent_id");
  CREATE INDEX "operators_rels_path_idx" ON "operators_rels" USING btree ("path");
  CREATE INDEX "operators_rels_cities_id_idx" ON "operators_rels" USING btree ("cities_id");
  CREATE INDEX "_operators_v_version_transport_modes_order_idx" ON "_operators_v_version_transport_modes" USING btree ("order");
  CREATE INDEX "_operators_v_version_transport_modes_parent_idx" ON "_operators_v_version_transport_modes" USING btree ("parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_buy_steps_order_idx" ON "_operators_v_version_purchase_methods_buy_steps" USING btree ("_order");
  CREATE INDEX "_operators_v_version_purchase_methods_buy_steps_parent_id_idx" ON "_operators_v_version_purchase_methods_buy_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_purchase_methods_buy_steps_locales_loca" ON "_operators_v_version_purchase_methods_buy_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_buy_steps_locales__idx" ON "_operators_v_version_purchase_methods_buy_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_steps_order_idx" ON "_operators_v_version_purchase_methods_validation_steps" USING btree ("_order");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_steps_parent_id_idx" ON "_operators_v_version_purchase_methods_validation_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_purchase_methods_validation_steps_local" ON "_operators_v_version_purchase_methods_validation_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_steps_l_idx" ON "_operators_v_version_purchase_methods_validation_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_photos_order_idx" ON "_operators_v_version_purchase_methods_validation_photos" USING btree ("_order");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_photos_parent_id_idx" ON "_operators_v_version_purchase_methods_validation_photos" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_photos__idx" ON "_operators_v_version_purchase_methods_validation_photos" USING btree ("image_id");
  CREATE UNIQUE INDEX "_operators_v_version_purchase_methods_validation_photos_loca" ON "_operators_v_version_purchase_methods_validation_photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_validation_photo_1_idx" ON "_operators_v_version_purchase_methods_validation_photos_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_order_idx" ON "_operators_v_version_purchase_methods" USING btree ("_order");
  CREATE INDEX "_operators_v_version_purchase_methods_parent_id_idx" ON "_operators_v_version_purchase_methods" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_purchase_methods_locales_locale_parent_" ON "_operators_v_version_purchase_methods_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_purchase_methods_locales_parent_id_idx" ON "_operators_v_version_purchase_methods_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_tickets_transport_modes_order_idx" ON "_operators_v_version_tickets_transport_modes" USING btree ("order");
  CREATE INDEX "_operators_v_version_tickets_transport_modes_parent_idx" ON "_operators_v_version_tickets_transport_modes" USING btree ("parent_id");
  CREATE INDEX "_operators_v_version_tickets_order_idx" ON "_operators_v_version_tickets" USING btree ("_order");
  CREATE INDEX "_operators_v_version_tickets_parent_id_idx" ON "_operators_v_version_tickets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_tickets_locales_locale_parent_id_unique" ON "_operators_v_version_tickets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_tickets_locales_parent_id_idx" ON "_operators_v_version_tickets_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_luggage_transport_modes_order_idx" ON "_operators_v_version_luggage_transport_modes" USING btree ("order");
  CREATE INDEX "_operators_v_version_luggage_transport_modes_parent_idx" ON "_operators_v_version_luggage_transport_modes" USING btree ("parent_id");
  CREATE INDEX "_operators_v_version_luggage_order_idx" ON "_operators_v_version_luggage" USING btree ("_order");
  CREATE INDEX "_operators_v_version_luggage_parent_id_idx" ON "_operators_v_version_luggage" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_luggage_locales_locale_parent_id_unique" ON "_operators_v_version_luggage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_luggage_locales_parent_id_idx" ON "_operators_v_version_luggage_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_zones_items_order_idx" ON "_operators_v_version_zones_items" USING btree ("_order");
  CREATE INDEX "_operators_v_version_zones_items_parent_id_idx" ON "_operators_v_version_zones_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_zones_items_locales_locale_parent_id_un" ON "_operators_v_version_zones_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_zones_items_locales_parent_id_idx" ON "_operators_v_version_zones_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_related_operators_order_idx" ON "_operators_v_version_related_operators" USING btree ("_order");
  CREATE INDEX "_operators_v_version_related_operators_parent_id_idx" ON "_operators_v_version_related_operators" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_related_operators_operator_idx" ON "_operators_v_version_related_operators" USING btree ("operator_id");
  CREATE UNIQUE INDEX "_operators_v_version_related_operators_locales_locale_parent" ON "_operators_v_version_related_operators_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_related_operators_locales_parent_id_idx" ON "_operators_v_version_related_operators_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_sources_items_order_idx" ON "_operators_v_version_sources_items" USING btree ("_order");
  CREATE INDEX "_operators_v_version_sources_items_parent_id_idx" ON "_operators_v_version_sources_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_operators_v_version_sources_items_locales_locale_parent_id_" ON "_operators_v_version_sources_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_version_sources_items_locales_parent_id_idx" ON "_operators_v_version_sources_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_version_tariff_sources_pages_order_idx" ON "_operators_v_version_tariff_sources_pages" USING btree ("_order");
  CREATE INDEX "_operators_v_version_tariff_sources_pages_parent_id_idx" ON "_operators_v_version_tariff_sources_pages" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_parent_idx" ON "_operators_v" USING btree ("parent_id");
  CREATE INDEX "_operators_v_version_version_slug_idx" ON "_operators_v" USING btree ("version_slug");
  CREATE INDEX "_operators_v_version_version_logo_idx" ON "_operators_v" USING btree ("version_logo_id");
  CREATE INDEX "_operators_v_version_zones_version_zones_map_idx" ON "_operators_v" USING btree ("version_zones_map_id");
  CREATE INDEX "_operators_v_version_version_updated_at_idx" ON "_operators_v" USING btree ("version_updated_at");
  CREATE INDEX "_operators_v_version_version_created_at_idx" ON "_operators_v" USING btree ("version_created_at");
  CREATE INDEX "_operators_v_created_at_idx" ON "_operators_v" USING btree ("created_at");
  CREATE INDEX "_operators_v_updated_at_idx" ON "_operators_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_operators_v_locales_locale_parent_id_unique" ON "_operators_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_operators_v_locales_parent_id_idx" ON "_operators_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_operators_v_rels_order_idx" ON "_operators_v_rels" USING btree ("order");
  CREATE INDEX "_operators_v_rels_parent_idx" ON "_operators_v_rels" USING btree ("parent_id");
  CREATE INDEX "_operators_v_rels_path_idx" ON "_operators_v_rels" USING btree ("path");
  CREATE INDEX "_operators_v_rels_cities_id_idx" ON "_operators_v_rels" USING btree ("cities_id");
  CREATE UNIQUE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");
  CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");
  CREATE INDEX "cities_region_idx" ON "cities" USING btree ("region_id");
  CREATE INDEX "cities_primary_operator_idx" ON "cities" USING btree ("primary_operator_id");
  CREATE INDEX "cities_updated_at_idx" ON "cities" USING btree ("updated_at");
  CREATE INDEX "cities_created_at_idx" ON "cities" USING btree ("created_at");
  CREATE UNIQUE INDEX "cities_locales_locale_parent_id_unique" ON "cities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "cities_locales_parent_id_idx" ON "cities_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "countries_code_idx" ON "countries" USING btree ("code");
  CREATE INDEX "countries_updated_at_idx" ON "countries" USING btree ("updated_at");
  CREATE INDEX "countries_created_at_idx" ON "countries" USING btree ("created_at");
  CREATE UNIQUE INDEX "countries_locales_locale_parent_id_unique" ON "countries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "countries_locales_parent_id_idx" ON "countries_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "regions_code_idx" ON "regions" USING btree ("code");
  CREATE INDEX "regions_country_idx" ON "regions" USING btree ("country_id");
  CREATE INDEX "regions_updated_at_idx" ON "regions" USING btree ("updated_at");
  CREATE INDEX "regions_created_at_idx" ON "regions" USING btree ("created_at");
  CREATE UNIQUE INDEX "regions_locales_locale_parent_id_unique" ON "regions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regions_locales_parent_id_idx" ON "regions_locales" USING btree ("_parent_id");
  CREATE INDEX "tariff_syncs_review_reasons_order_idx" ON "tariff_syncs_review_reasons" USING btree ("_order");
  CREATE INDEX "tariff_syncs_review_reasons_parent_id_idx" ON "tariff_syncs_review_reasons" USING btree ("_parent_id");
  CREATE INDEX "tariff_syncs_pages_order_idx" ON "tariff_syncs_pages" USING btree ("_order");
  CREATE INDEX "tariff_syncs_pages_parent_id_idx" ON "tariff_syncs_pages" USING btree ("_parent_id");
  CREATE INDEX "tariff_syncs_operator_idx" ON "tariff_syncs" USING btree ("operator_id");
  CREATE INDEX "tariff_syncs_status_idx" ON "tariff_syncs" USING btree ("status");
  CREATE INDEX "tariff_syncs_updated_at_idx" ON "tariff_syncs" USING btree ("updated_at");
  CREATE INDEX "tariff_syncs_created_at_idx" ON "tariff_syncs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_operators_id_idx" ON "payload_locked_documents_rels" USING btree ("operators_id");
  CREATE INDEX "payload_locked_documents_rels_cities_id_idx" ON "payload_locked_documents_rels" USING btree ("cities_id");
  CREATE INDEX "payload_locked_documents_rels_countries_id_idx" ON "payload_locked_documents_rels" USING btree ("countries_id");
  CREATE INDEX "payload_locked_documents_rels_regions_id_idx" ON "payload_locked_documents_rels" USING btree ("regions_id");
  CREATE INDEX "payload_locked_documents_rels_tariff_syncs_id_idx" ON "payload_locked_documents_rels" USING btree ("tariff_syncs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "operators_transport_modes" CASCADE;
  DROP TABLE "operators_purchase_methods_buy_steps" CASCADE;
  DROP TABLE "operators_purchase_methods_buy_steps_locales" CASCADE;
  DROP TABLE "operators_purchase_methods_validation_steps" CASCADE;
  DROP TABLE "operators_purchase_methods_validation_steps_locales" CASCADE;
  DROP TABLE "operators_purchase_methods_validation_photos" CASCADE;
  DROP TABLE "operators_purchase_methods_validation_photos_locales" CASCADE;
  DROP TABLE "operators_purchase_methods" CASCADE;
  DROP TABLE "operators_purchase_methods_locales" CASCADE;
  DROP TABLE "operators_tickets_transport_modes" CASCADE;
  DROP TABLE "operators_tickets" CASCADE;
  DROP TABLE "operators_tickets_locales" CASCADE;
  DROP TABLE "operators_luggage_transport_modes" CASCADE;
  DROP TABLE "operators_luggage" CASCADE;
  DROP TABLE "operators_luggage_locales" CASCADE;
  DROP TABLE "operators_zones_items" CASCADE;
  DROP TABLE "operators_zones_items_locales" CASCADE;
  DROP TABLE "operators_related_operators" CASCADE;
  DROP TABLE "operators_related_operators_locales" CASCADE;
  DROP TABLE "operators_sources_items" CASCADE;
  DROP TABLE "operators_sources_items_locales" CASCADE;
  DROP TABLE "operators_tariff_sources_pages" CASCADE;
  DROP TABLE "operators" CASCADE;
  DROP TABLE "operators_locales" CASCADE;
  DROP TABLE "operators_rels" CASCADE;
  DROP TABLE "_operators_v_version_transport_modes" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_buy_steps" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_buy_steps_locales" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_validation_steps" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_validation_steps_locales" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_validation_photos" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_validation_photos_locales" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods" CASCADE;
  DROP TABLE "_operators_v_version_purchase_methods_locales" CASCADE;
  DROP TABLE "_operators_v_version_tickets_transport_modes" CASCADE;
  DROP TABLE "_operators_v_version_tickets" CASCADE;
  DROP TABLE "_operators_v_version_tickets_locales" CASCADE;
  DROP TABLE "_operators_v_version_luggage_transport_modes" CASCADE;
  DROP TABLE "_operators_v_version_luggage" CASCADE;
  DROP TABLE "_operators_v_version_luggage_locales" CASCADE;
  DROP TABLE "_operators_v_version_zones_items" CASCADE;
  DROP TABLE "_operators_v_version_zones_items_locales" CASCADE;
  DROP TABLE "_operators_v_version_related_operators" CASCADE;
  DROP TABLE "_operators_v_version_related_operators_locales" CASCADE;
  DROP TABLE "_operators_v_version_sources_items" CASCADE;
  DROP TABLE "_operators_v_version_sources_items_locales" CASCADE;
  DROP TABLE "_operators_v_version_tariff_sources_pages" CASCADE;
  DROP TABLE "_operators_v" CASCADE;
  DROP TABLE "_operators_v_locales" CASCADE;
  DROP TABLE "_operators_v_rels" CASCADE;
  DROP TABLE "cities" CASCADE;
  DROP TABLE "cities_locales" CASCADE;
  DROP TABLE "countries" CASCADE;
  DROP TABLE "countries_locales" CASCADE;
  DROP TABLE "regions" CASCADE;
  DROP TABLE "regions_locales" CASCADE;
  DROP TABLE "tariff_syncs_review_reasons" CASCADE;
  DROP TABLE "tariff_syncs_pages" CASCADE;
  DROP TABLE "tariff_syncs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_operators_transport_modes";
  DROP TYPE "public"."enum_operators_purchase_methods_type";
  DROP TYPE "public"."enum_operators_tickets_transport_modes";
  DROP TYPE "public"."enum_operators_tickets_category";
  DROP TYPE "public"."enum_operators_luggage_transport_modes";
  DROP TYPE "public"."enum_operators_related_operators_relation";
  DROP TYPE "public"."enum_operators_related_operators_ticket_validity";
  DROP TYPE "public"."enum__operators_v_version_transport_modes";
  DROP TYPE "public"."enum__operators_v_version_purchase_methods_type";
  DROP TYPE "public"."enum__operators_v_version_tickets_transport_modes";
  DROP TYPE "public"."enum__operators_v_version_tickets_category";
  DROP TYPE "public"."enum__operators_v_version_luggage_transport_modes";
  DROP TYPE "public"."enum__operators_v_version_related_operators_relation";
  DROP TYPE "public"."enum__operators_v_version_related_operators_ticket_validity";
  DROP TYPE "public"."enum_tariff_syncs_status";
  DROP TYPE "public"."enum_tariff_syncs_failed_stage";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
