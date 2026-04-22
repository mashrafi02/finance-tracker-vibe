CREATE TYPE "public"."budget_type" AS ENUM('SPENDING', 'INCOME_GOAL');--> statement-breakpoint
DROP INDEX "budgets_user_category_month_idx";--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "type" "budget_type" DEFAULT 'SPENDING' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_category_month_type_idx" ON "budgets" USING btree ("user_id","category_id","month","type");