CREATE TABLE "monthly_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"report_data" jsonb NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reports_user_month_idx" ON "monthly_reports" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "monthly_reports_user_id_idx" ON "monthly_reports" USING btree ("user_id");