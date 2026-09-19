CREATE TABLE "auth_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(180) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"providers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"device_id" varchar(36) NOT NULL,
	"platform" varchar(10) NOT NULL,
	"model" varchar(50),
	"notify" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	CONSTRAINT "user_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "import_metadata" (
	"meta_key" varchar(100) PRIMARY KEY NOT NULL,
	"meta_value" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_token" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token" varchar(255) NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_update_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"source" varchar(50),
	"ip_address" varchar(45),
	"lang" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "weekly_data" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"week" date NOT NULL,
	"us30_yr_frm" double precision,
	"thirty_yr_fees_points" double precision,
	"us15_yr_frm" double precision,
	"fifteen_yr_fees_points" double precision,
	"us5_1_arm" double precision,
	"five_1_fees_points" double precision,
	"five_1_arm_margin" double precision,
	"us30_yr_frm5_1_arm_spread" double precision,
	"source" varchar(32) DEFAULT 'auto' NOT NULL,
	CONSTRAINT "weekly_data_week_unique" UNIQUE("week")
);
--> statement-breakpoint
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_update_history" ADD CONSTRAINT "user_update_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_push_token_user_id" ON "push_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_push_token_device_id" ON "push_token" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "user_update_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_updated_at" ON "user_update_history" USING btree ("updated_at");