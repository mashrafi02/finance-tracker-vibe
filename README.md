# Personal Finance Tracker

> A comprehensive web application to track income and expenses, manage budgets, set savings goals, and visualize spending patterns.
> Built with Next.js 16, TypeScript, custom JWT auth, Drizzle ORM, and Shadcn UI.

## Features

### Core Financial Management
- **Transaction tracking** — log income and expenses with categories, descriptions, notes, and dates
- **Smart balance checking** — warns when transactions exceed available funds, showing current balance
- **Budget management** — set monthly spending limits or income goals per category with real-time progress tracking
- **Budget alerts** — get warned before submitting transactions that would exceed your budget, with option to proceed anyway
- **Category management** — create custom categories with color palettes and emoji icons via emoji picker
- **Manual balance adjustment** — set your starting balance or make corrections anytime

### Savings & Goals
- **Savings goals** — create named goals with target amounts and track progress
- **Contribution tracking** — add funds to goals with date tracking and automatic balance deduction
- **Progress visualization** — see percentage complete and amount remaining for each goal
- **Recent activity** — view your latest savings contributions across all goals

### Analytics & Reporting
- **Analytics dashboard** — monthly bar charts, category breakdown, and spending trends
- **Monthly reports** — automatically generated financial summaries with income, expense, and category breakdowns
- **Report export** — download detailed PDF reports for any month
- **Budget performance tracking** — monitor spending vs. limits with visual indicators
- **Savings growth charts** — visualize your savings progress over time

### User Experience
- **Multi-currency support** — switch between USD ($) and BDT (৳) with dynamic formatting throughout the app
- **Command menu** — keyboard-driven navigation (⌘K / Ctrl+K) for quick access to any page
- **Dark mode** — full light and dark theme support with smooth transitions
- **Gradient backgrounds** — subtle animated gradients optimized for both themes
- **Responsive design** — works seamlessly on desktop, tablet, and mobile devices
- **Smart notifications** — contextual toasts for success, error, and warning states

### Security & Authentication
- **Custom JWT authentication** — secure email/password auth with httpOnly cookies
- **Protected routes** — middleware-enforced authentication for all dashboard pages
- **Password recovery** — send a reset link by email and set a new password with a time-limited token
- **Profile management** — update name, username, bio, profile image, and password
- **Account deletion** — permanent account removal with confirmation dialog

## Tech stack

| Concern | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, TypeScript, React 19) |
| Styling | Tailwind CSS v4 + Shadcn UI (base-nova style) |
| Authentication | Custom JWT (`jose`) stored in httpOnly cookies |
| Email delivery | Nodemailer with Gmail App Password credentials |
| Password Hashing | bcryptjs (12 rounds) |
| ORM | Drizzle ORM 0.45 |
| Database | PostgreSQL |
| Migrations | Drizzle Kit |
| Charts | Recharts 3.8 (via Shadcn Charts) |
| Tables | TanStack Table v8 |
| Forms | React Hook Form + Zod |
| State Management | SWR 2.4 (data fetching and caching) |
| Icons | Lucide React |
| Emoji Picker | Emoji Picker React |
| Notifications | Sonner |
| Command Menu | cmdk |
| Date Handling | date-fns |
| PDF Generation | pdf-lib (for report exports) |
| Image Upload | Cloudinary (for profile images) |

## Getting started

### Prerequisites

- Node.js 18 or later
- PostgreSQL (local or hosted — [Railway](https://railway.app), [Supabase](https://supabase.com), or [Neon](https://neon.tech) work well)
- pnpm (recommended) or npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/finance-tracker-vibe.git
cd finance-tracker-vibe

# 2. Install dependencies
pnpm install

# 3. Create .env file and add your environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET (see section below)

# 4. Push the database schema to PostgreSQL
pnpm drizzle-kit push

# 5. (Optional) Seed with sample data
pnpm tsx db/seed.ts

# 6. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs — minimum 32 characters |
| `NEXT_PUBLIC_APP_URL` | No | Base app URL used to build password reset links in emails |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for profile image uploads |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `GMAIL_APP_USER` | Yes | Gmail address used to send password reset emails |
| `GMAIL_APP_PASSWORD` | Yes | Gmail App Password used by Nodemailer |

**Note:** Cloudinary credentials are optional. Profile images will still work without them, using a default avatar.

**Note:** `GMAIL_APP_USER` and `GMAIL_APP_PASSWORD` are required for password reset emails. Set `NEXT_PUBLIC_APP_URL` to your deployed app URL in production so email links point to the right domain.

Generate a secure `JWT_SECRET`:
```bash
openssl rand -base64 32
```

## Database

This app uses **Drizzle ORM** with **PostgreSQL**.

Schema is defined in [db/schema.ts](db/schema.ts). Migrations are generated and applied with Drizzle Kit:

```bash
# After changing db/schema.ts, generate a migration
pnpm drizzle-kit generate

# Apply pending migrations
pnpm drizzle-kit push

# Open Drizzle Studio (visual database browser)
pnpm drizzle-kit studio
```

### Schema overview

| Table | Description |
|---|---|
| `users` | Registered accounts — email, bcrypt-hashed password, name, username, bio, imageUrl |
| `accounts` | User balance tracking — one row per user with current available funds |
| `categories` | User-defined transaction groupings with color (hex) and emoji icon |
| `transactions` | Income and expense entries with amount, type, description, date, and category link |
| `budgets` | Monthly spending limits or income goals per category (one row per category per month per type) |
| `savings_goals` | Named savings targets with target amount and accumulated saved amount |
| `savings_entries` | Individual contributions to savings goals with amount and date |
| `monthly_reports` | Auto-generated monthly financial summaries stored as JSON for fast retrieval |

## Authentication

Authentication uses **custom JWT** — no NextAuth or third-party auth library.

- Passwords are hashed with bcrypt (12 rounds)
- JWTs are signed with HS256, expire after 7 days
- Tokens are stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie
- All dashboard routes and data API routes are protected by [middleware.ts](middleware.ts)
- The user's identity in API routes always comes from the verified JWT payload — never from request parameters
- Password recovery uses single-use reset tokens sent by email and expires after 1 hour

## Key workflows

### Transaction creation with smart checks
1. User fills transaction form and selects category/amount
2. **Budget check** — if expense exceeds category's monthly budget, warning dialog shows projected overage with option to proceed
3. **Balance check** — if expense exceeds available balance, form shows error with current balance amount
4. Transaction is saved only after passing checks or user confirmation
5. Balance is automatically updated (income adds, expense subtracts)

### Savings contribution flow
1. User selects a savings goal and enters contribution amount
2. **Balance check** — validates sufficient funds before deducting from account
3. Contribution is recorded with date
4. Account balance decreases by contribution amount
5. Goal's `savedAmount` increments automatically
6. Progress percentage updates in real-time

### Budget management
- Create **spending limits** (caps for expense categories) or **income goals** (targets for income categories)
- One budget per category per month per type
- Add funds to existing budgets mid-month if needed
- Visual indicators show: spent amount, remaining, percentage used, and overspent status
- Overspent budgets trigger alerts on dashboard

### Monthly report generation
- Reports auto-generate at month-end or can be created manually anytime
- Stored as JSON in `monthly_reports` table for fast retrieval
- Include: total income, total expenses, net change, category breakdowns, top spending categories
- Exportable as PDF with formatted tables and charts

## API reference

See [docs/api.md](./docs/api.md) for the full REST API documentation.

## Project structure

```
├── app/
│   ├── (auth)/              # Login, register, forgot/reset password pages (public)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/         # Protected dashboard pages and layouts
│   │   ├── page.tsx         # Main dashboard
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budget-management/
│   │   ├── savings/
│   │   ├── analytics/
│   │   ├── reports/
│   │   └── profile/
│   └── api/                 # REST API route handlers
│       ├── accounts/        # Balance management
│       ├── analytics/       # Analytics data
│       ├── auth/            # Login, register, logout
│       ├── budgets/         # Budget CRUD and add-funds
│       ├── categories/      # Category CRUD
│       ├── profile/         # Profile updates, password change, image upload
│       ├── reports/         # Monthly report generation and retrieval
│       ├── savings-entries/ # Savings contribution CRUD
│       ├── savings-goals/   # Savings goal CRUD
│       ├── summary/         # Dashboard summary data
│       └── transactions/    # Transaction CRUD
├── components/
│   ├── ui/                  # Shadcn UI primitives (auto-generated)
│   ├── transactions/        # Transaction components + TanStack Table + over-budget dialog
│   ├── budgets/             # Budget cards, sheets, add-funds dialog, overspent alerts
│   ├── categories/          # Category table, form, sheet with emoji picker
│   ├── savings/             # Savings goal cards, contribution dialogs, recent activity
│   ├── reports/             # Report table and view dialog
│   ├── charts/              # Recharts wrappers for income/expense, spending breakdown, sparklines
│   ├── dashboard/           # Balance card, summary card, monthly reports row, savings card
│   ├── analytics/           # Analytics page client components, stat cards, charts
│   ├── layout/              # Sidebar nav, header, mobile nav, currency switcher
│   ├── profile/             # Profile forms (name, password, image, delete account)
│   ├── auth/                # Login/register/forgot/reset forms, logout button
│   ├── theme/               # Theme provider and toggle
│   ├── command-menu.tsx     # Global keyboard command menu (⌘K)
│   └── command-menu-dialog.tsx
├── contexts/
│   └── currency-context.tsx # Currency state (USD/BDT) with formatting and symbol helpers
├── db/
│   ├── index.ts             # Drizzle client singleton
│   ├── schema.ts            # All table definitions with indexes
│   └── migrations/          # Auto-generated by drizzle-kit
├── lib/
│   ├── auth.ts              # JWT sign/verify/cookie helpers, user display name
│   ├── validations/         # Zod schemas per domain (auth, transaction, budget, etc.)
│   └── utils.ts             # formatCurrency, formatDate, cn(), fetcher
├── hooks/                   # SWR data-fetching hooks (use-balance, use-budgets, etc.)
├── providers/               # React context providers wrapper
├── middleware.ts            # JWT verification and route protection
└── .github/agents/          # GitHub Copilot custom agent definitions
```

## Key pages and routes

| Route | Description |
|---|---|
| `/` | **Dashboard** — balance card with manual adjustment, monthly income/expense summary chart, recent transactions, budget alerts, savings overview, and latest reports |
| `/transactions` | **Transaction list** — filterable table with date range, category, type, and description search; add/edit/delete transactions with budget checking |
| `/categories` | **Category management** — create and edit categories with color palette picker and emoji selector; view transaction count per category |
| `/budget-management` | **Budget planning** — set monthly spending limits or income goals per category; add funds to existing budgets; view progress bars and overspent warnings |
| `/savings` | **Savings goals** — create goals with target amounts; add contributions; track progress with percentage bars; view recent savings activity |
| `/analytics` | **Analytics dashboard** — monthly spending trends bar chart, category breakdown pie chart, budget performance cards, and savings growth visualization |
| `/reports` | **Monthly reports** — view and download PDF reports for any month with detailed income, expense, and category breakdowns |
| `/profile` | **Profile settings** — update account info (name, username, bio, image); change password; delete account with confirmation |
| `/login` | Public login page with email/password authentication |
| `/register` | Public registration page with validation and automatic account creation |
| `/forgot-password` | Public password recovery page that sends a reset link by email |
| `/reset-password` | Public password reset page that accepts a token from the email link |

## Running tests

```bash
pnpm test                  # run all tests
pnpm test:coverage         # run with coverage report
```

Coverage thresholds: 80% lines, 80% functions, 75% branches.

## Design system

### Currency support
- **Supported currencies:** USD ($) and BDT (৳)
- **Default:** BDT (Bangladeshi Taka)
- **Switcher:** Available in header on all dashboard pages
- **Persistence:** Selection saved to localStorage
- **Dynamic formatting:** All amounts automatically re-format when currency changes
- **Input fields:** Currency symbol in all financial input fields updates reactively

### Visual design
- **Border radius** — global `--radius: 0.375rem` for soft rectangular shapes; buttons use `1.25rem` for pill-like feel
- **Colors** — OKLCH color space for perceptually uniform gradients
- **Gradient backgrounds** — multi-stop radial gradients (cool blue/peach/mint in light mode, indigo/magenta/teal in dark mode)
- **Typography** — Poppins font family (300, 400, 500, 600, 700 weights)
- **Animations** — `Reveal` component with staggered fade-up entrance for smooth page loads
- **Shadows** — subtle elevation with `shadow-card` utility for depth
- **Icons** — Lucide React for UI icons, native emoji for categories

### Interaction patterns
- **Command menu** — Global keyboard shortcut (⌘K / Ctrl+K) opens searchable navigation
- **Dialogs** — Modal forms for create/edit actions with backdrop blur
- **Sheets** — Slide-in panels for secondary actions
- **Toasts** — Sonner notifications for success, error, and warning states in bottom-right
- **Skeleton loaders** — Shimmer effect during data fetching for perceived performance

## Contributing

1. Pick a feature from the issues list
2. Open Copilot Chat in VS Code and select the **Planner** agent
3. Describe the feature — the Planner will read the codebase and produce an implementation plan
4. Follow the agent handoff chain: Planner → Backend → Frontend → Testing → Security → Docs
5. Open a pull request when all checks pass

## License

MIT
