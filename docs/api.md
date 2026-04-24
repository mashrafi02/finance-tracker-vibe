# API Documentation

All endpoints except `/api/auth/login` and `/api/auth/register` require a valid JWT stored in the `auth-token` httpOnly cookie. Unauthenticated requests return `401`.

---

## Authentication

### `POST /api/auth/register`

Create a new account.

**Authentication**: Not required

**Request body**

```json
{
  "email": "user@example.com",
  "username": "janesmith",
  "password": "Password123",
  "name": "Jane Smith"
}
```

**Validation rules**
- `email` — valid email format
- `username` — min 3 chars, max 30 chars, alphanumeric + underscores only
- `password` — min 8 chars, at least one uppercase letter, at least one number
- `name` — min 2 chars, max 100 chars

**Response `201 Created`**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "janesmith",
    "name": "Jane Smith"
  }
}
```

Sets `auth-token` httpOnly cookie on success.

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `409` | Email or username already registered |
| `500` | Internal server error |

---

### `POST /api/auth/login`

Authenticate with email and password.

**Authentication**: Not required

**Request body**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response `200 OK`**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "janesmith",
    "name": "Jane Smith"
  }
}
```

Sets `auth-token` httpOnly cookie on success.

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Invalid email or password |
| `500` | Internal server error |

---

### `POST /api/auth/logout`

Log out the current user by clearing the auth cookie.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Logged out successfully"
}
```

Clears the `auth-token` cookie.

---

### `GET /api/auth/me`

Get the current authenticated user's information.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "janesmith",
  "name": "Jane Smith"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |

---

## Transactions

### `GET /api/transactions`

Return a paginated list of the authenticated user's transactions.

**Authentication**: Required

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `pageSize` | number | `10` | Results per page (max 100) |
| `sort` | string | `date.desc` | Sort field and direction: `date.asc`, `date.desc`, `amount.asc`, `amount.desc`, `createdAt.asc`, `createdAt.desc` |
| `from` | string | — | Filter by start date (ISO 8601 format: `YYYY-MM-DD`) |
| `to` | string | — | Filter by end date (inclusive, ISO 8601 format) |
| `type` | string | — | Filter by `INCOME` or `EXPENSE` |
| `categoryId` | string | — | Filter by category ID (comma-separated for multiple) |
| `description` | string | — | Case-insensitive search in description field |

**Response `200 OK`**

```json
{
  "data": [
    {
      "id": "550e8400-...",
      "amount": "49.99",
      "type": "EXPENSE",
      "description": "Weekly groceries",
      "date": "2024-06-15T00:00:00.000Z",
      "createdAt": "2024-06-15T12:34:56.000Z",
      "category": {
        "id": "...",
        "name": "Food",
        "color": "#22c55e",
        "icon": "🛒"
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

**Note**: `amount` is returned as a string from PostgreSQL's `numeric` column type. Use `Number(amount)` or `formatCurrency(amount)` in the frontend.

**Error responses**

| Status | Reason |
|---|---|
| `400` | Invalid query parameters |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/transactions`

Create a new transaction.

**Authentication**: Required

**Request body**

```json
{
  "amount": 49.99,
  "type": "EXPENSE",
  "description": "Weekly groceries",
  "date": "2024-06-15",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation rules**
- `amount` — positive number, max 2 decimal places
- `type` — must be `INCOME` or `EXPENSE`
- `description` — min 1 char, max 500 chars
- `date` — valid ISO 8601 date string
- `categoryId` — must reference an existing category owned by the authenticated user

**Response `201 Created`**

```json
{
  "id": "550e8400-...",
  "amount": "49.99",
  "type": "EXPENSE",
  "description": "Weekly groceries",
  "date": "2024-06-15T00:00:00.000Z",
  "createdAt": "2024-06-15T12:34:56.000Z",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `404` | Category not found or not owned by user |
| `500` | Internal server error |

---

### `PATCH /api/transactions/[id]`

Update an existing transaction.

**Authentication**: Required

**Request body** (all fields optional)

```json
{
  "amount": 52.50,
  "type": "EXPENSE",
  "description": "Weekly groceries + snacks",
  "date": "2024-06-15",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response `200 OK`**

```json
{
  "id": "550e8400-...",
  "amount": "52.50",
  "type": "EXPENSE",
  "description": "Weekly groceries + snacks",
  "date": "2024-06-15T00:00:00.000Z",
  "createdAt": "2024-06-15T12:34:56.000Z",
  "categoryId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `404` | Transaction not found or not owned by user |
| `500` | Internal server error |

---

### `DELETE /api/transactions/[id]`

Delete a transaction.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Transaction deleted"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `404` | Transaction not found or not owned by user |
| `500` | Internal server error |

---

## Categories

### `GET /api/categories`

Return all categories for the authenticated user.

**Authentication**: Required

**Response `200 OK`**

```json
[
  {
    "id": "550e8400-...",
    "name": "Food",
    "color": "#22c55e",
    "icon": "🛒",
    "userId": "550e8400-..."
  },
  {
    "id": "660f9511-...",
    "name": "Transport",
    "color": "#3b82f6",
    "icon": "🚗",
    "userId": "550e8400-..."
  }
]
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/categories`

Create a new category.

**Authentication**: Required

**Request body**

```json
{
  "name": "Entertainment",
  "color": "#a855f7",
  "icon": "🎮"
}
```

**Validation rules**
- `name` — min 1 char, max 50 chars, unique per user
- `color` — valid hex color string (e.g., `#a855f7`)
- `icon` — single emoji character

**Response `201 Created`**

```json
{
  "id": "770g0622-...",
  "name": "Entertainment",
  "color": "#a855f7",
  "icon": "🎮",
  "userId": "550e8400-..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `409` | Category name already exists for this user |
| `500` | Internal server error |

---

### `PATCH /api/categories/[id]`

Update an existing category.

**Authentication**: Required

**Request body** (all fields optional)

```json
{
  "name": "Fun & Entertainment",
  "color": "#a855f7",
  "icon": "🎉"
}
```

**Response `200 OK`**

```json
{
  "id": "770g0622-...",
  "name": "Fun & Entertainment",
  "color": "#a855f7",
  "icon": "🎉",
  "userId": "550e8400-..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `404` | Category not found or not owned by user |
| `409` | Category name already exists for this user |
| `500` | Internal server error |

---

### `DELETE /api/categories/[id]`

Delete a category. This will fail if any transactions reference this category.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Category deleted"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Category is in use by transactions (cascade restriction) |
| `401` | Not authenticated |
| `404` | Category not found or not owned by user |
| `500` | Internal server error |

---

## Budgets

### `GET /api/budgets`

Return budget status for all categories for a given month.

**Authentication**: Required

**Query parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `month` | string | Yes | Month in `YYYY-MM` format (e.g., `2024-06`) |

**Response `200 OK`**

```json
[
  {
    "categoryId": "550e8400-...",
    "categoryName": "Food",
    "categoryIcon": "🛒",
    "categoryColor": "#22c55e",
    "budgetId": "880h1733-...",
    "limit": "500.00",
    "spent": "342.75",
    "remaining": "157.25",
    "percentUsed": 68.55
  },
  {
    "categoryId": "660f9511-...",
    "categoryName": "Transport",
    "categoryIcon": "🚗",
    "categoryColor": "#3b82f6",
    "budgetId": null,
    "limit": null,
    "spent": "120.00",
    "remaining": null,
    "percentUsed": null
  }
]
```

**Note**: Categories without a budget for the requested month will have `budgetId`, `limit`, `remaining`, and `percentUsed` set to `null`.

**Error responses**

| Status | Reason |
|---|---|
| `400` | Invalid month format |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/budgets`

Create a new budget for a category and month.

**Authentication**: Required

**Request body**

```json
{
  "categoryId": "550e8400-...",
  "limit": 500.00,
  "month": "2024-06"
}
```

**Validation rules**
- `categoryId` — must reference an existing category owned by the authenticated user
- `limit` — positive number, max 2 decimal places
- `month` — valid `YYYY-MM` format

**Response `201 Created`**

```json
{
  "id": "880h1733-...",
  "categoryId": "550e8400-...",
  "limit": "500.00",
  "month": "2024-06",
  "userId": "550e8400-..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `404` | Category not found or not owned by user |
| `409` | Budget already exists for this category and month |
| `500` | Internal server error |

---

### `PATCH /api/budgets/[id]`

Update an existing budget's limit.

**Authentication**: Required

**Request body**

```json
{
  "limit": 600.00
}
```

**Response `200 OK`**

```json
{
  "id": "880h1733-...",
  "categoryId": "550e8400-...",
  "limit": "600.00",
  "month": "2024-06",
  "userId": "550e8400-..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `404` | Budget not found or not owned by user |
| `500` | Internal server error |

---

### `DELETE /api/budgets/[id]`

Delete a budget.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Budget deleted"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `404` | Budget not found or not owned by user |
| `500` | Internal server error |

---

## Analytics

### `GET /api/analytics/summary`

Return monthly income, expenses, and savings for the authenticated user.

**Authentication**: Required

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `range` | string | `monthly` | Time range: `monthly`, `quarterly`, `yearly` |

**Response `200 OK`** (monthly range)

```json
{
  "range": "monthly",
  "data": [
    {
      "month": "2024-06",
      "income": "3500.00",
      "expenses": "2345.67",
      "savings": "1154.33"
    },
    {
      "month": "2024-05",
      "income": "3200.00",
      "expenses": "2100.50",
      "savings": "1099.50"
    }
  ]
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Invalid range parameter |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `GET /api/analytics/spending`

Return spending breakdown by category for a given time range.

**Authentication**: Required

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `from` | string | — | Start date (ISO 8601 format: `YYYY-MM-DD`) |
| `to` | string | — | End date (inclusive, ISO 8601 format) |

**Response `200 OK`**

```json
{
  "from": "2024-06-01",
  "to": "2024-06-30",
  "data": [
    {
      "categoryId": "550e8400-...",
      "categoryName": "Food",
      "categoryIcon": "🛒",
      "categoryColor": "#22c55e",
      "total": "342.75",
      "percentage": 35.2
    },
    {
      "categoryId": "660f9511-...",
      "categoryName": "Transport",
      "categoryIcon": "🚗",
      "categoryColor": "#3b82f6",
      "total": "120.00",
      "percentage": 12.3
    }
  ]
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Invalid date parameters |
| `401` | Not authenticated |
| `500` | Internal server error |

---

## Summary

### `GET /api/summary`

Return dashboard summary data including total balance, income, expenses, and savings rate.

**Authentication**: Required

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `range` | string | `monthly` | Time range: `monthly`, `quarterly`, `yearly` |

**Response `200 OK`**

```json
{
  "balance": "15234.50",
  "income": "3500.00",
  "expenses": "2345.67",
  "savingsRate": 32.98,
  "totalBudget": "2000.00",
  "budgetUsed": "1234.56",
  "budgetRemaining": "765.44",
  "period": "2024-06"
}
```

**Fields**
- `balance` — total of all income transactions minus all expense transactions (all-time)
- `income` — total income for the current period
- `expenses` — total expenses for the current period
- `savingsRate` — percentage of income saved: `(income - expenses) / income * 100`
- `totalBudget` — sum of all budget limits for the current month
- `budgetUsed` — sum of all expenses against budgeted categories for the current month
- `budgetRemaining` — `totalBudget - budgetUsed`
- `period` — the month/quarter/year being summarized

**Error responses**

| Status | Reason |
|---|---|
| `400` | Invalid range parameter |
| `401` | Not authenticated |
| `500` | Internal server error |

---

## Profile

### `PATCH /api/profile`

Update the authenticated user's name or password.

**Authentication**: Required

**Request body** (provide one or both fields)

```json
{
  "name": "Jane Doe"
}
```

Or to change password:

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Validation rules**
- `name` — min 2 chars, max 100 chars
- `currentPassword` — required if changing password
- `newPassword` — min 8 chars, at least one uppercase letter, at least one number

**Response `200 OK`**

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-...",
    "email": "user@example.com",
    "username": "janesmith",
    "name": "Jane Doe"
  }
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed or current password incorrect |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `DELETE /api/profile`

Delete the authenticated user's account and all associated data (cascade delete).

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Account deleted successfully"
}
```

Clears the `auth-token` cookie on success.

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

## Accounts

### `GET /api/accounts/balance`

Get the current account balance for the authenticated user.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "balance": 1523.75
}
```

**Note:** Balance is returned as a number. If no account exists for the user, returns `0`.

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `PUT /api/accounts/balance`

Set the account balance to an explicit amount. Used for initial setup or manual corrections.

**Authentication**: Required

**Request body**

```json
{
  "balance": 2000.00
}
```

**Validation rules**
- `balance` — must be a number >= 0

**Response `200 OK`**

```json
{
  "balance": 2000.00
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed (negative balance or invalid number) |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/budgets/add-funds`

Increase an existing budget's monthly limit by a specified amount.

**Authentication**: Required

**Request body**

```json
{
  "budgetId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 150.00
}
```

**Validation rules**
- `budgetId` — must be a valid UUID
- `amount` — must be a positive number > 0

**Response `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "limit": "650.00",
  "month": "2026-04",
  "type": "SPENDING",
  "categoryId": "...",
  "userId": "..."
}
```

**Note:** The response includes the updated budget with the new limit.

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `403` | Budget belongs to another user |
| `404` | Budget not found |
| `500` | Internal server error |

---

## Savings Goals

### `GET /api/savings-goals`

Get all savings goals for the authenticated user.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "goals": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Emergency Fund",
      "targetAmount": "10000.00",
      "savedAmount": "2345.50",
      "createdAt": "2024-06-15T12:34:56.000Z",
      "userId": "..."
    }
  ]
}
```

**Note:** `targetAmount` and `savedAmount` are returned as strings from PostgreSQL's `numeric` column type.

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/savings-goals`

Create a new savings goal.

**Authentication**: Required

**Request body**

```json
{
  "name": "Dream Vacation",
  "targetAmount": 5000.00
}
```

**Validation rules**
- `name` — min 1 char, max 100 chars
- `targetAmount` — positive number > 0

**Response `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Dream Vacation",
  "targetAmount": "5000.00",
  "savedAmount": "0",
  "createdAt": "2024-06-15T12:34:56.000Z",
  "userId": "..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `PUT /api/savings-goals/[id]`

Update an existing savings goal's name or target amount.

**Authentication**: Required

**Request body**

```json
{
  "name": "Updated Name",
  "targetAmount": 7500.00
}
```

**Validation rules**
- At least one field must be provided
- `name` — min 1 char, max 100 chars (if provided)
- `targetAmount` — positive number > 0 (if provided)

**Response `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Name",
  "targetAmount": "7500.00",
  "savedAmount": "2345.50",
  "createdAt": "2024-06-15T12:34:56.000Z",
  "userId": "..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `403` | Goal belongs to another user |
| `404` | Goal not found |
| `500` | Internal server error |

---

### `DELETE /api/savings-goals/[id]`

Delete a savings goal and all associated entries.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Savings goal deleted"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Goal belongs to another user |
| `404` | Goal not found |
| `500` | Internal server error |

---

### `GET /api/savings-goals/[id]/entries`

Get all savings entries (contributions) for a specific goal.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": "150.00",
      "date": "2024-06-15T00:00:00.000Z",
      "createdAt": "2024-06-15T12:34:56.000Z",
      "savingsGoalId": "...",
      "userId": "..."
    }
  ]
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Goal belongs to another user |
| `404` | Goal not found |
| `500` | Internal server error |

---

### `POST /api/savings-goals/[id]/entries`

Add a contribution to a savings goal. Deducts amount from account balance.

**Authentication**: Required

**Request body**

```json
{
  "amount": 200.00,
  "date": "2024-06-15T00:00:00.000Z"
}
```

**Validation rules**
- `amount` — positive number > 0
- `date` — ISO 8601 datetime string

**Response `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": "200.00",
  "date": "2024-06-15T00:00:00.000Z",
  "createdAt": "2024-06-15T12:34:56.000Z",
  "savingsGoalId": "...",
  "userId": "..."
}
```

**Note:** This endpoint:
1. Checks if user has sufficient balance
2. Creates the savings entry
3. Increments the goal's `savedAmount`
4. Decrements the user's account balance

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `402` | Insufficient balance to add funds |
| `403` | Goal belongs to another user |
| `404` | Goal not found |
| `500` | Internal server error |

---

### `GET /api/savings-entries/recent`

Get the 5 most recent savings entries across all goals for the authenticated user.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "entries": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": "150.00",
      "date": "2024-06-15T00:00:00.000Z",
      "createdAt": "2024-06-15T12:34:56.000Z",
      "goalName": "Emergency Fund"
    }
  ]
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `PUT /api/savings-entries/[id]`

Update a savings entry's amount or date. Balance is automatically adjusted.

**Authentication**: Required

**Request body**

```json
{
  "amount": 250.00,
  "date": "2024-06-16T00:00:00.000Z"
}
```

**Validation rules**
- At least one field must be provided
- `amount` — positive number > 0 (if provided)
- `date` — ISO 8601 datetime string (if provided)

**Response `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": "250.00",
  "date": "2024-06-16T00:00:00.000Z",
  "createdAt": "2024-06-15T12:34:56.000Z",
  "savingsGoalId": "...",
  "userId": "..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed |
| `401` | Not authenticated |
| `403` | Entry belongs to another user |
| `404` | Entry not found |
| `500` | Internal server error |

---

### `DELETE /api/savings-entries/[id]`

Delete a savings entry. Refunds amount to account balance and decrements goal's `savedAmount`.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Savings entry deleted"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Entry belongs to another user |
| `404` | Entry not found |
| `500` | Internal server error |

---

## Monthly Reports

### `GET /api/reports`

Get all monthly reports for the authenticated user.

**Authentication**: Required

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | number | `12` | Max number of reports to return |

**Response `200 OK`**

```json
{
  "reports": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "month": "2024-06",
      "generatedAt": "2024-07-01T00:00:00.000Z",
      "reportData": {
        "totalIncome": 3500.00,
        "totalExpense": 2100.50,
        "netChange": 1399.50,
        "categories": [
          {
            "categoryId": "...",
            "categoryName": "Food",
            "categoryIcon": "🛒",
            "categoryColor": "#22c55e",
            "totalAmount": 450.25,
            "transactionCount": 12
          }
        ],
        "topSpendingCategories": ["Food", "Transport", "Entertainment"]
      },
      "userId": "..."
    }
  ]
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/reports`

Generate a monthly report for a specific month.

**Authentication**: Required

**Request body**

```json
{
  "month": "2024-06"
}
```

**Validation rules**
- `month` — format `YYYY-MM`

**Response `201 Created`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "month": "2024-06",
  "generatedAt": "2024-07-01T00:00:00.000Z",
  "reportData": { ... },
  "userId": "..."
}
```

**Note:** If a report already exists for this month, returns the existing report with `200 OK`.

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed (invalid month format) |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `GET /api/reports/[id]`

Get a specific monthly report by ID.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "month": "2024-06",
  "generatedAt": "2024-07-01T00:00:00.000Z",
  "reportData": { ... },
  "userId": "..."
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Report belongs to another user |
| `404` | Report not found |
| `500` | Internal server error |

---

### `DELETE /api/reports/[id]`

Delete a monthly report.

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Report deleted"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `403` | Report belongs to another user |
| `404` | Report not found |
| `500` | Internal server error |

---

## Profile Management

### `PUT /api/profile/password`

Change the authenticated user's password.

**Authentication**: Required

**Request body**

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Validation rules**
- `currentPassword` — min 1 char
- `newPassword` — min 8 chars, at least one uppercase letter, at least one number

**Response `200 OK`**

```json
{
  "message": "Password updated successfully"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | Validation failed or current password incorrect |
| `401` | Not authenticated |
| `500` | Internal server error |

---

### `POST /api/profile/image`

Upload a profile image to Cloudinary and update the user's `imageUrl`.

**Authentication**: Required

**Request body** (multipart/form-data)

```
image: <file>
```

**Validation rules**
- File must be an image (JPEG, PNG, GIF, WebP)
- Max file size varies by Cloudinary plan (typically 10MB)

**Response `200 OK`**

```json
{
  "imageUrl": "https://res.cloudinary.com/.../profile_image.jpg"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `400` | No image file provided or invalid format |
| `401` | Not authenticated |
| `500` | Upload failed or Cloudinary error |

---

### `DELETE /api/profile/image`

Remove the user's profile image (sets `imageUrl` to null).

**Authentication**: Required

**Response `200 OK`**

```json
{
  "message": "Profile image removed"
}
```

**Error responses**

| Status | Reason |
|---|---|
| `401` | Not authenticated |
| `500` | Internal server error |

---

## Error response format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

For validation errors, an additional `details` field is included:

```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```
