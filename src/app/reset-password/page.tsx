'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { useResetPassword } from '@/hooks/api/useAuth'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''
  const resetPasswordMutation = useResetPassword()
  const [serverMessage, setServerMessage] = useState('')

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromUrl,
      newPassword: '',
      confirmPassword: '',
    },
  })

  const hasPresetToken = useMemo(() => Boolean(tokenFromUrl), [tokenFromUrl])

  const onSubmit = (values: ResetPasswordInput) => {
    setServerMessage('')
    resetPasswordMutation.mutate(values, {
      onSuccess: () => {
        setServerMessage('Password reset successful. You can now sign in with your new password.')
      },
    })
  }

  return (
    <CardContent className="space-y-4">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormField
            control={form.control}
            name="token"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reset token</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Paste reset token"
                    autoComplete="off"
                    readOnly={hasPresetToken}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="At least 8 characters" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Re-enter new password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
            <KeyRound className="h-4 w-4 mr-2" />
            {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </Form>

      {serverMessage ? (
        <p role="status" className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
          {serverMessage}
        </p>
      ) : null}

      <Link
        href="/login"
        className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to login
      </Link>
    </CardContent>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-heading">Reset password</CardTitle>
          <CardDescription>Provide your reset token and a new password.</CardDescription>
        </CardHeader>
        <Suspense fallback={<CardContent className="space-y-4"><div className="h-[400px] flex items-center justify-center">Loading...</div></CardContent>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </main>
  )
}
