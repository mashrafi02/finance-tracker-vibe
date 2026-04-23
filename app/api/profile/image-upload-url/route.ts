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

export async function POST(req: Request) {
  // 1. Authenticate
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Get the image data from the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('[POST /api/profile/image-upload-url] No file provided')
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[POST /api/profile/image-upload-url] File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[POST /api/profile/image-upload-url] Invalid file type:', file.type)
      return Response.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[POST /api/profile/image-upload-url] File too large:', file.size)
      return Response.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // 3. Convert File to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('[POST /api/profile/image-upload-url] Starting Cloudinary upload...')

    // 4. Upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'finance-tracker/profiles',
          public_id: user.userId,
          overwrite: true,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('[POST /api/profile/image-upload-url] Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('[POST /api/profile/image-upload-url] Cloudinary upload success:', result?.secure_url)
            resolve(result as { secure_url: string })
          }
        }
      )

      uploadStream.end(buffer)
    })

    // 5. Update database with new image URL
    const [updated] = await db
      .update(users)
      .set({ imageUrl: uploadResult.secure_url })
      .where(eq(users.id, user.userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        name: users.name,
        imageUrl: users.imageUrl,
        bio: users.bio,
      })

    if (!updated) {
      console.error('[POST /api/profile/image-upload-url] User not found')
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[POST /api/profile/image-upload-url] Success, returning URL:', uploadResult.secure_url)

    return Response.json({ 
      imageUrl: uploadResult.secure_url,
      user: updated 
    })
  } catch (error) {
    console.error('[POST /api/profile/image-upload-url]', error)
    return Response.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
