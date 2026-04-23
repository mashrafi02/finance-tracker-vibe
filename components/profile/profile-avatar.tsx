'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Loader2, UserRound, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProfileAvatarProps {
  imageUrl: string | null
  name: string
  onImageChange: () => void
  /** Size in px — defaults to 80 */
  size?: number
}

export function ProfileAvatar({
  imageUrl,
  name,
  onImageChange,
  size = 80,
}: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isLoading = isUploading || isDeleting

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile/image-upload-url', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      toast.success('Profile photo updated')
      onImageChange()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/profile/image', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove image')
      toast.success('Profile photo removed')
      onImageChange()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove photo. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const avatarStyle = { width: size, height: size }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar with camera badge */}
      <div className="relative" style={avatarStyle}>
        <button
          type="button"
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Change profile photo"
          className="group block size-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar
            className={cn(
              'size-full ring-4 ring-card shadow-md transition-opacity',
              isLoading && 'opacity-70',
            )}
          >
            {imageUrl && <AvatarImage src={imageUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-primary size-full">
              {imageUrl ? null : (
                <UserRound
                  className={cn('stroke-[1.5]', size >= 80 ? 'size-10' : 'size-6')}
                  aria-hidden="true"
                />
              )}
            </AvatarFallback>
          </Avatar>

          {/* hover overlay */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera className="size-6 text-white" />
          </span>
        </button>

        {/* Camera badge — always visible */}
        <button
          type="button"
          onClick={() => !isLoading && fileInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Upload new photo"
          className="absolute bottom-0.5 right-0.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-card transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </button>
      </div>

      {/* Remove link */}
      {imageUrl && !isLoading && (
        <button
          type="button"
          onClick={handleRemove}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="size-3" />
          Remove photo
        </button>
      )}
      {isDeleting && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Removing…
        </span>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

