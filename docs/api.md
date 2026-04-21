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
