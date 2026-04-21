'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONFIRM_PHRASE = 'DELETE'

export function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const canDelete = confirmText === CONFIRM_PHRASE

  async function handleDelete() {
    if (!canDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to delete account')
        setIsDeleting(false)
        return
      }

      toast.success('Your account has been deleted')
      setOpen(false)
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </div>
        <CardDescription>
          Permanently delete your account and all associated transactions, categories,
          and budgets. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Once your account is deleted, all your financial data will be permanently removed
        from our servers.
      </CardContent>
      <CardFooter className="justify-end border-t border-destructive/30 bg-destructive/5">
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) setConfirmText('')
          }}
        >
          <AlertDialogTrigger
            className={cn(buttonVariants({ variant: 'destructive' }), 'text-white')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all of your data including
                transactions, categories, and budgets. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                Type <span className="font-mono font-semibold text-destructive">{CONFIRM_PHRASE}</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
                disabled={isDeleting}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={!canDelete || isDeleting}
                variant="destructive"
                className="text-white"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
