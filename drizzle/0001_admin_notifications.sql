CREATE TABLE "admin_push_subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" varchar(255) NOT NULL,
	"auth" varchar(255) NOT NULL,
	"user_agent" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "auth_user" ADD COLUMN "notify_new_users" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_user" ADD COLUMN "notify_returning_users" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_push_subscription" ADD CONSTRAINT "admin_push_subscription_auth_user_id_auth_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_push_subscription_user" ON "admin_push_subscription" USING btree ("auth_user_id");