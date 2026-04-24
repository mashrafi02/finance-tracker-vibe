import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Reset Password',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <Card className="w-full border-border/80 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <CardContent className="flex flex-col items-center gap-4 pb-8 pt-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">Invalid reset link</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              This password reset link is missing a token. Please request a new
              password reset link.
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/60 bg-muted/30">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return <ResetPasswordForm token={token} />
}
