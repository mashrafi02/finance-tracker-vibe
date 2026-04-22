CREATE TABLE "savings_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"savings_goal_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "savings_entries" ADD CONSTRAINT "savings_entries_savings_goal_id_savings_goals_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_entries" ADD CONSTRAINT "savings_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "savings_entries_user_id_idx" ON "savings_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "savings_entries_goal_id_idx" ON "savings_entries" USING btree ("savings_goal_id");