import { ProfileNav } from '@/components/profile/profile-nav'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">My Profile</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </section>

      <ProfileNav />

      {children}
    </div>
  )
}
