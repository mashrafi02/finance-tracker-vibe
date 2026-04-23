import { db } from '@/db'
import { accounts } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import { updateBalanceSchema } from '@/lib/validations/account'
import { eq } from 'drizzle-orm'

/**
 * GET /api/accounts/balance
 * Returns the current account balance for the authenticated user.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [account] = await db
      .select({ balance: accounts.balance })
      .from(accounts)
      .where(eq(accounts.userId, user.userId))
      .limit(1)

    return Response.json({ balance: account ? Number(account.balance) : 0 })
  } catch (error) {
    console.error('[GET /api/accounts/balance]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/accounts/balance
 * Sets the account balance to an explicit amount.
 * Used for initial setup ("I currently have X") and manual corrections.
 * Income transactions also add to the balance automatically.
 */
export async function PUT(req: Request) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const result = updateBalanceSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  try {
    const [account] = await db
      .insert(accounts)
      .values({
        userId: user.userId,
        balance: result.data.balance.toFixed(2),
      })
      .onConflictDoUpdate({
        target: accounts.userId,
        set: { balance: result.data.balance.toFixed(2) },
      })
      .returning({ balance: accounts.balance })

    return Response.json({ balance: Number(account.balance) })
  } catch (error) {
    console.error('[PUT /api/accounts/balance]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
