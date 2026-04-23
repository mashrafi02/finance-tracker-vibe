import { getAuthUser } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function DELETE() {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Update database to remove image URL
    await db
      .update(users)
      .set({ imageUrl: null })
      .where(eq(users.id, user.userId))

    // 3. Delete image from Cloudinary
    const publicId = `finance-tracker/profiles/${user.userId}`
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (cloudinaryError) {
      // Log but don't fail if Cloudinary deletion fails
      // The image URL is already removed from the database
      console.error('[DELETE /api/profile/image] Cloudinary deletion failed:', cloudinaryError)
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/profile/image]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
