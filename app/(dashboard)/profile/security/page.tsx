import { ChangePasswordForm } from '@/components/profile/change-password-form'
import { DeleteAccountSection } from '@/components/profile/delete-account-section'

export default function SecurityPage() {
  return (
    <div className="space-y-5">
      <ChangePasswordForm />
      <DeleteAccountSection />
    </div>
  )
}
