'use client'

import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { ProfileForm } from '@/components/profile/profile-form'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, AtSign } from 'lucide-react'

interface User {
  userId: string
  email: string
  username: string
  name: string
  imageUrl: string | null
  bio: string | null
}

export function ProfilePageClient({ initialUser }: { initialUser: User }) {
  const { data: user, mutate } = useSWR<User>('/api/auth/me', fetcher, {
    fallbackData: initialUser,
  })

  if (!user) return null

  const handleUpdate = () => mutate()

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <Card className="overflow-hidden pt-0">
        {/* Gradient band */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        <CardContent className="pt-0 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar — pulled up over the band */}
            <ProfileAvatar
              imageUrl={user.imageUrl}
              name={user.name}
              onImageChange={handleUpdate}
              size={88}
            />

            {/* Identity info */}
            <div className="min-w-0 flex-1 sm:pb-1">
              <h3 className="truncate text-xl font-semibold leading-snug">{user.name}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <AtSign className="size-3.5 shrink-0" />
                  {user.username}
                </span>
              </div>
              {user.bio && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground/80">{user.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable profile form — has its own Card */}
      <ProfileForm
        initialData={{ name: user.name, bio: user.bio }}
        onSuccess={handleUpdate}
      />
    </div>
  )
}

