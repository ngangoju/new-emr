'use client'

import Link from 'next/link'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { useForgotPassword } from '@/hooks/api/useAuth'

const MASKED_FORGOT_PASSWORD_MESSAGE =
  'If an account exists for this email, password reset instructions have been sent.'

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword()
  const [message, setMessage] = useState<string>('')

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (values: ForgotPasswordInput) => {
    setMessage('')
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        setMessage(MASKED_FORGOT_PASSWORD_MESSAGE)
      },
      onError: () => {
        setMessage(MASKED_FORGOT_PASSWORD_MESSAGE)
      },
    })
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-heading">Forgot password</CardTitle>
          <CardDescription>
            Enter your email to request password reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
                <Mail className="h-4 w-4 mr-2" />
                {forgotPasswordMutation.isPending ? 'Submitting...' : 'Send reset instructions'}
              </Button>
            </form>
          </Form>

          {message ? (
            <p role="status" className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
              {message}
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
      </Card>
    </main>
  )
}
