import {
  pgTable,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core'

export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE'])
export const budgetTypeEnum = pgEnum('budget_type', ['SPENDING', 'INCOME_GOAL'])

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('accounts_user_id_idx').on(t.userId),
])

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  color: text('color').notNull(),   // hex string e.g. "#22c55e"
  icon: text('icon').notNull(),     // emoji e.g. "🛒"
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  index('categories_user_id_idx').on(t.userId),
])

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  index('transactions_user_id_idx').on(t.userId),
  index('transactions_date_idx').on(t.date),
  index('transactions_category_id_idx').on(t.categoryId),
])

export const budgets = pgTable('budgets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  limit: numeric('limit', { precision: 12, scale: 2 }).notNull(),
  month: text('month').notNull(),   // "YYYY-MM"
  type: budgetTypeEnum('type').notNull().default('SPENDING'),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  uniqueIndex('budgets_user_category_month_type_idx').on(t.userId, t.categoryId, t.month, t.type),
])

export const savingsGoals = pgTable('savings_goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  targetAmount: numeric('target_amount', { precision: 12, scale: 2 }).notNull(),
  savedAmount: numeric('saved_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  index('savings_goals_user_id_idx').on(t.userId),
])

export const savingsEntries = pgTable('savings_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  savingsGoalId: text('savings_goal_id')
    .notNull()
    .references(() => savingsGoals.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  index('savings_entries_user_id_idx').on(t.userId),
  index('savings_entries_goal_id_idx').on(t.savingsGoalId),
])

export const monthlyReports = pgTable('monthly_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  month: text('month').notNull(),   // "YYYY-MM"
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  reportData: jsonb('report_data').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
}, (t) => [
  uniqueIndex('reports_user_month_idx').on(t.userId, t.month),
  index('monthly_reports_user_id_idx').on(t.userId),
])

// Inferred types — import these in API routes and components
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type SavingsGoal = typeof savingsGoals.$inferSelect
export type NewSavingsGoal = typeof savingsGoals.$inferInsert
export type SavingsEntry = typeof savingsEntries.$inferSelect
export type NewSavingsEntry = typeof savingsEntries.$inferInsert
export type MonthlyReport = typeof monthlyReports.$inferSelect
export type NewMonthlyReport = typeof monthlyReports.$inferInsert
