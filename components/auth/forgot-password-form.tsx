'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      // Always show the success state regardless of server response
      // to prevent email enumeration (backend returns 200 either way)
      if (res.ok || res.status === 400) {
        setSubmitted(true)
        return
      }

      form.setError('root', {
        message: 'Something went wrong. Please try again.',
      })
    } catch {
      form.setError('root', {
        message: 'Something went wrong. Please try again.',
      })
    }
  }

  if (submitted) {
    return (
      <Card className="w-full border-border/80 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <CardContent className="flex flex-col items-center gap-4 pb-8 pt-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">Check your email</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              If an account exists for{' '}
              <span className="font-medium text-foreground">
                {form.getValues('email')}
              </span>
              , you will receive a password reset link shortly.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive an email? Check your spam folder, or{' '}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              try again
            </button>
            .
          </p>
        </CardContent>
        <CardFooter className="justify-center border-t border-border/60 bg-muted/30">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full border-border/80 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
      <CardHeader className="space-y-2 pb-2">
        <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Mail className="h-5 w-5" />
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Forgot your password?
        </CardTitle>
        <CardDescription>
          Enter the email address linked to your account and we&apos;ll send you
          a reset link.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="mt-1 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send reset link
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/60 bg-muted/30">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
