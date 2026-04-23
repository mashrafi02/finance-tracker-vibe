import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { categories as categoriesTable } from '@/db/schema'
import { getAuthUser } from '@/lib/auth'
import {
  CategoriesPageClient,
  type Category,
} from '@/components/categories/categories-page-client'

export default async function CategoriesPage() {
  const user = await getAuthUser()
  if (!user) return null

  const rows = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.userId, user.userId))
    .orderBy(categoriesTable.name)

  return <CategoriesPageClient initialCategories={rows as Category[]} />
}
